const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const redirectApp = express(); // Additional Express app for handling redirects
const port = 3000;
const redirectPort = 3001; // Port 3001 for redirecting to __loader initially

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Redirect server setup
redirectApp.get('/', (req, res) => {
  res.redirect(`/__loader`);
});

// Start the redirect server on port 3001
const redirectServer = redirectApp.listen(redirectPort, () => {
  console.log(`Redirect server running at http://localhost:${redirectPort}`);
});

app.post('/clone-and-run', (req, res) => {
  const { repoUrl, startCommand = 'npm start' } = req.body;
  const cloneDir = `./cloned_repos/${Date.now()}`;

  // Stop the redirect server before starting the new app
  redirectServer.close(() => {
    console.log('Redirect server stopped to allow the cloned repo service to run on port 3001.');

    const cloneAndRun = spawn('bash', [
      '-c',
      `git clone ${repoUrl} ${cloneDir} && cd ${cloneDir} && npm install && PORT=3001 ${startCommand} &`
    ]);

    let outputData = '';
    let errorData = '';

    cloneAndRun.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      outputData += data;
    });

    cloneAndRun.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      errorData += data;
    });

    cloneAndRun.on('close', (code) => {
      if (code !== 0) {
        console.error(`clone-and-run process exited with code ${code}`);
        return res
          .status(500)
          .send(`Process exited with code ${code}. Error: ${errorData}`);
      }
      console.log(`Process completed with output: ${outputData}`);
      res.redirect('/repo/');
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
