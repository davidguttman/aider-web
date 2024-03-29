const express = require('express')
const { spawn } = require('child_process')
const fs = require('fs')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const app = express()
const redirectApp = express() // Additional Express app for handling redirects
const port = 3000
const redirectPort = 3001 // Port 3001 for redirecting to __loader initially

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Serve static files from the 'public' directory
app.use(express.static('public'))

// Redirect server setup
redirectApp.get('*', (req, res) => {
  res.writeHead(302, { Location: '/__loader/' })
  res.end()
})

// Start the redirect server on port 3001
const redirectServer = redirectApp.listen(redirectPort, () => {
  console.log(`Redirect server running at http://localhost:${redirectPort}`)
})

app.post('/clone-and-run', (req, res) => {
  // Stop the redirect server once the repo is cloned and the service starts on port 3001
  redirectServer.close(() => {
    console.log(
      'Redirect server stopped to allow the cloned repo service to run on port 3001.'
    )
  })
  
  const { repoUrl, startCommand = 'npm start', sshKey, envFile } = req.body
  const cloneDir = `./cloned_repos/${Date.now()}`

  // Parse .env content into an object using dotenv
  const envVars = dotenv.parse(envFile)

  // Write the SSH key to a temporary file
  const sshKeyPath = `/tmp/ssh_key_${Date.now()}`
  fs.writeFileSync(sshKeyPath, sshKey, { mode: '600' })

  // Setup command to start the SSH agent and add the key
  const setupSSH = `eval $(ssh-agent -s) && ssh-add ${sshKeyPath}`

  // Prepare environment variables for the child process
  const childEnv = {
    ...process.env,
    ...envVars,
    PORT: redirectPort // Override PORT variable for the child process
  }

  // Clone, and run the repo command
  const cloneAndRunCmd = `${setupSSH} && GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git clone ${repoUrl} ${cloneDir} && cd ${cloneDir} && npm install && ${startCommand}`

  const cloneAndRun = spawn('bash', ['-c', cloneAndRunCmd], { env: childEnv })

  cloneAndRun.stdout.on('data', data => {
    console.log(`stdout: ${data}`)
  })

  cloneAndRun.stderr.on('data', data => {
    console.error(`stderr: ${data}`)
  })

  cloneAndRun.on('close', code => {
    if (code !== 0) {
      console.error(`clone-and-run process exited with code ${code}`)
      return res.status(500).send(`Process exited with code ${code}`)
    }
    
    console.log(`Process completed with output: ${outputData}`)
    res.redirect('/')
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
