#!/bin/bash

# Name of your Docker image
IMAGE_NAME="aider-web"

# Name of your Docker container for easy reference
CONTAINER_NAME="aider-web-container"

# Stop and remove the existing container (if it exists), ignoring errors
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build a new image
docker build -t $IMAGE_NAME .

# Run a new container from the newly built image
docker run --name $CONTAINER_NAME -p 3000:80 -d $IMAGE_NAME
# Follow the logs of the container
echo "Following logs for $CONTAINER_NAME. Press Ctrl+C to stop."
docker logs -f $CONTAINER_NAME
