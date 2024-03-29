#!/bin/bash

# Attempt to start Nginx and log any errors
service nginx start 2>&1 | tee /var/log/nginx/startup.log

# Instead of exiting if Nginx fails, just print a warning
if ! service nginx status; then
    echo "WARNING: Nginx failed to start. See /var/log/nginx/startup.log for details."
    # Keep the container running by tailing a log file or running a simple daemon
    tail -f /dev/null
fi

# Start your Node.js application (this will now be in the background)
npm start
