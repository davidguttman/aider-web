#!/bin/bash

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    set -a # Automatically export all variables
    source .env
    set +a
fi

# Name of your Docker image
IMAGE_NAME=${IMAGE_NAME:-"aider-web"}

# Name of your Docker container for easy reference
CONTAINER_NAME=${CONTAINER_NAME:-"aider-web-container"}

# Stop and remove the existing container (if it exists), ignoring errors
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build a new image
docker build -t $IMAGE_NAME .

# Prepare environment variables for docker run command
ENV_VARS=""
for var in $(compgen -e); do
    # Filter out variables not defined in .env
    grep -q "^$var=" .env || continue
    value=${!var}
    ENV_VARS+="-e $var=\"$value\" "
done

# Run a new container from the newly built image with environment variables
eval "docker run --name $CONTAINER_NAME -p 3000:80 -d $ENV_VARS $IMAGE_NAME"

# Follow the logs of the container
echo "Following logs for $CONTAINER_NAME. Press Ctrl+C to stop."
docker logs -f $CONTAINER_NAME
