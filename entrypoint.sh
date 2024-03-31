#!/bin/bash

# Setup SSH for git clone if SSH_KEY_BASE64 is provided
if [ -n "$SSH_KEY_BASE64" ]; then
    echo "Setting up SSH key from base64-encoded environment variable..."
    echo "SSH_KEY_BASE64: $SSH_KEY_BASE64"
    mkdir -p /root/.ssh
    echo "$SSH_KEY_BASE64" | base64 -d > /root/.ssh/id_rsa
    chmod 600 /root/.ssh/id_rsa
    
    # Disable strict host key checking for SSH
    echo "Disabling strict SSH host key checking..."
    export GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
    echo "GIT_SSH_COMMAND: $GIT_SSH_COMMAND"
    
    # Optionally, you can still add github.com to known_hosts for added security
    # ssh-keyscan github.com >> /root/.ssh/known_hosts
fi

# Clone the second repository if REPO_URL is provided
if [ -n "$REPO_URL" ]; then
    echo "Cloning second repository $REPO_URL into /usr/src/second-app..."
    echo "REPO_URL: $REPO_URL"
    git clone $REPO_URL /usr/src/second-app
    cd /usr/src/second-app
fi

# Execute build command for the second app if BUILD_COMMAND is provided
if [ -n "$BUILD_COMMAND" ]; then
    echo "Executing build command for the second app: $BUILD_COMMAND..."
    echo "BUILD_COMMAND: $BUILD_COMMAND"
    eval $BUILD_COMMAND
fi

# Set $PORT to 3001 for the second application
export PORT=3001
echo "PORT set to $PORT for the second application."
echo "PORT: $PORT"

# Start the second application with the provided START_COMMAND
if [ -n "$START_COMMAND" ]; then
    echo "Starting the second application with custom command: $START_COMMAND..."
    echo "START_COMMAND: $START_COMMAND"
    eval $START_COMMAND &
else
    echo "No start command provided for the second application."
fi

# Change back to the first app's directory
cd /usr/src/app

# Attempt to start Nginx and log any errors
echo "Starting Nginx..."
service nginx start 2>&1 | tee /var/log/nginx/startup.log

# Instead of exiting if Nginx fails, just print a warning
if ! service nginx status; then
    echo "WARNING: Nginx failed to start. See /var/log/nginx/startup.log for details."
    # Keep the container running by tailing a log file or running a simple daemon
    tail -f /dev/null
fi

# Start the original Node.js application in the background
echo "Starting the original Node.js application..."
npm start