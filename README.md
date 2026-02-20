# aider-web

A web-based interface for [Aider](https://aider.chat), the AI coding assistant. Run Aider in your browser with real-time terminal streaming over WebSocket.

## Overview

aider-web wraps the Aider CLI in a browser-accessible terminal using xterm.js and WebSocket. It also supports running a second application alongside Aider (e.g., the project you're editing), with Nginx routing between the two.

### Architecture

```
Browser (xterm.js) <--WebSocket--> Node.js (node-pty) <--pty--> Aider process
                                         |
                   Nginx (port 80) ------+---- /__aider/ --> :3000 (aider server)
                                         +---- /         --> :3001 (second app)
```

## Quick Start

### Local Development

```bash
npm install
REPO_DIRECTORY=/path/to/your/repo npm run dev
```

The server starts on port 3000. Open `http://localhost:3000` to access the Aider terminal.

### Docker

```bash
# Build and run
docker build -t aider-web .
docker run -p 80:80 \
  -e REPO_URL=https://github.com/user/repo.git \
  -e BUILD_COMMAND="npm install" \
  -e START_COMMAND="npm start" \
  aider-web
```

Or use the helper script with a `.env` file:

```bash
cp .env.example .env  # create and edit your .env
./rebuild-and-run.sh
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `REPO_DIRECTORY` | Path to the git repo Aider works on | `./` |
| `REPO_URL` | Git URL of a second repo to clone at startup | _(none)_ |
| `BUILD_COMMAND` | Build command for the second app | _(none)_ |
| `START_COMMAND` | Start command for the second app (runs on port 3001) | _(none)_ |
| `SSH_KEY_BASE64` | Base64-encoded SSH private key for private repos | _(none)_ |
| `NODE_ENV` | Node environment | `development` |

Any Aider-specific environment variables (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) should also be set so the Aider process can pick them up.

## How It Works

1. **Server** (`server.js`) - Express app on port 3000. Serves static files and handles WebSocket upgrades.
2. **WebSocket protocol** - Client sends `{ type: "init", dimensions: { cols, rows } }` to spawn an Aider process, then `{ type: "input", data: "..." }` to send keystrokes. Server streams raw terminal output back.
3. **Terminal** (`public/index.html`) - xterm.js provides a full terminal emulator in the browser. ANSI output from Aider is rendered with color/formatting support.
4. **Nginx** (`nginx.conf`) - Reverse proxy on port 80. Routes `/__aider/` to the Node.js server and `/` to the second application on port 3001.
5. **Entrypoint** (`entrypoint.sh`) - Docker startup script that sets up SSH keys, clones the second repo, starts the second app, launches Nginx, and starts the Node.js server.

## Project Structure

```
.
├── server.js                 # Node.js WebSocket server (spawns Aider via node-pty)
├── public/
│   ├── index.html            # Browser terminal UI (xterm.js + WebSocket)
│   └── index2.html           # Legacy clone/run form (unused)
├── nginx.conf                # Reverse proxy config
├── entrypoint.sh             # Docker container startup script
├── Dockerfile                # Production image (Node 20 + Python 3.10 + Aider)
├── docker-node-python/
│   └── Dockerfile            # Base image: foxbarrington/node-20-python-3.10
├── rebuild-and-run.sh        # Local Docker build & run helper
├── captain-definition        # CapRover deployment config
└── package.json
```

## Tech Stack

- **Node.js / Express** - HTTP server and static file serving
- **ws** - WebSocket server
- **node-pty** - Pseudo-terminal for spawning Aider
- **xterm.js** - Browser terminal emulator
- **ansi_up** - ANSI-to-HTML conversion
- **Nginx** - Reverse proxy
- **Python 3.10** - Aider runtime
- **Docker** - Containerization

## Deployment

The project includes a `captain-definition` for [CapRover](https://caprover.com/) deployment. It uses the Dockerfile which builds on a custom Node 20 + Python 3.10 base image.

The container exposes port 80 (Nginx) and expects environment variables to be configured on the hosting platform.

## Notes

- There is no authentication. Deploy behind a VPN or auth proxy for production use.
- Each WebSocket connection spawns a separate Aider process. Sessions are not persisted across disconnects.
- The second app feature is optional. Without `REPO_URL`/`START_COMMAND`, only the Aider interface is available (directly on port 3000 or via `/__aider/` through Nginx).
