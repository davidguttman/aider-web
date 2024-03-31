const fs = require('fs')
const pty = require('node-pty')
// const dotenv = require('dotenv')
const express = require('express')
const WebSocket = require('ws')
// const { spawn } = require('child_process')
const bodyParser = require('body-parser')

// const REPO_DIRECTORY = './cloned_repos/app'
const REPO_DIRECTORY = '/usr/src/second-app'

const port = 3000
// const redirectPort = 3001 // Port 3001 for redirecting to __control initially

const app = express()
// const redirectApp = express() // Additional Express app for handling redirects

const wss = new WebSocket.Server({ noServer: true })

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Serve static files from the 'public' directory
app.use(express.static('public'))

// // Redirect server setup
// redirectApp.get('/', redirectHandler)

// // Start the redirect server on port 3001
// const redirectServer = redirectApp.listen(redirectPort, () => {
//   console.log(`Redirect server running at http://localhost:${redirectPort}`)
// })

// app.post('/clone-and-run', cloneAndRunHandler)

// Handle WebSocket upgrade requests
app.server = app.listen(port, function () {
  console.log(`Server running at http://localhost:${port}`)
})

app.server.on('upgrade', upgradeHandler)

wss.on('connection', wsConnectionHandler)

// function redirectHandler (req, res) {
//   res.writeHead(302, { Location: '/__control/' })
//   res.end()
// }

// function cloneAndRunHandler (req, res) {
//   const { repoUrl, startCommand = 'npm start', sshKey, envFile } = req.body
//   const cloneDir = REPO_DIRECTORY
//   const envVars = parseEnvFile(envFile)
//   const sshKeyPath = writeSSHKey(sshKey)
//   const setupSSH = setupSSHCommand(sshKeyPath)
//   const childEnv = prepareChildEnv(envVars)
//   executeCloneAndRun(repoUrl, cloneDir, startCommand, setupSSH, childEnv, res)
// }

// function parseEnvFile (envFile) {
//   return dotenv.parse(envFile)
// }

// function writeSSHKey (sshKey) {
//   const sshKeyPath = `/tmp/ssh_key_${Date.now()}`
//   fs.writeFileSync(sshKeyPath, sshKey, { mode: '600' })
//   return sshKeyPath
// }

// function setupSSHCommand (sshKeyPath) {
//   return `eval $(ssh-agent -s) && ssh-add ${sshKeyPath}`
// }

// function prepareChildEnv (envVars) {
//   return {
//     ...process.env,
//     ...envVars,
//     PORT: redirectPort // Override PORT variable for the child process
//   }
// }

// function executeCloneAndRun(repoUrl, cloneDir, startCommand, setupSSH, childEnv, res) {
//   const startSequence = '---Starting the service---'
//   const cloneAndRunCmd = `${setupSSH} && GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git clone ${repoUrl} ${cloneDir} && cd ${cloneDir} && npm install && echo "${startSequence}" && ${startCommand}`

//   const cloneAndRun = spawn('bash', ['-c', cloneAndRunCmd], { env: childEnv })

//   cloneAndRun.stdout.on('data', data => {
//     console.log(`stdout: ${data}`)
//     if (data.includes(startSequence)) {
//       startAider()
//       // Send a response to the client to redirect to the cloned repo service
//       setTimeout(() => {
//         res.redirect('/')
//       }, 1000)
//     }
//   })

//   cloneAndRun.stderr.on('data', data => {
//     console.error(`stderr: ${data}`)
//   })

//   cloneAndRun.on('close', code => {
//     if (code !== 0) {
//       console.error(`clone-and-run process exited with code ${code}`)
//       return res.status(500).send(`Process exited with code ${code}`)
//     }

//     console.log(`Process completed successfully`)
//   })
// }

function upgradeHandler (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit('connection', ws, request)
  })
}

function wsConnectionHandler (ws) {
  let pythonProcess

  ws.on('message', function (msg) {
    const message = JSON.parse(msg)

    if (message.type === 'init') {
      // Initialize the node-pty process with the provided dimensions
      const { cols, rows } = message.dimensions
      pythonProcess = pty.spawn('aider', [], {
        cwd: REPO_DIRECTORY,
        name: 'xterm-color',
        cols,
        rows,
        env: process.env
      })

      pythonProcess.on('data', function (data) {
        ws.send(data)
      })
    } else if (message.type === 'input') {
      // Forward input to the node-pty process
      if (pythonProcess) {
        pythonProcess.write(message.data)
      }
    }
  })

  ws.on('close', () => {
    if (pythonProcess) {
      pythonProcess.kill()
    }
  })
}
