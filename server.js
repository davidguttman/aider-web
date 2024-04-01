const fs = require('fs')
const pty = require('node-pty')
const express = require('express')
const WebSocket = require('ws')
const bodyParser = require('body-parser')

const REPO_DIRECTORY = process.env.REPO_DIRECTORY || './'

const port = 3000

const app = express()

const wss = new WebSocket.Server({ noServer: true })

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Serve static files from the 'public' directory
app.use(express.static('public'))

// Handle WebSocket upgrade requests
app.server = app.listen(port, function () {
  console.log(`Server running at http://localhost:${port}`)
})

app.server.on('upgrade', upgradeHandler)

wss.on('connection', wsConnectionHandler)

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
        console.log('python: ', data)
        ws.send(data)
      })
    } else if (message.type === 'input') {
      console.log('input: ', message.data)
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
