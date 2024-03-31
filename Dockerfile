FROM foxbarrington/node-20-python-3.10:latest

# Install Nginx and Git
RUN apt-get update && apt-get install -y nginx git build-essential

RUN python3 -m pip install aider-chat

# Set the working directory in the container
WORKDIR /usr/src/app


COPY . .

RUN rm -rf node_modules

# Install any needed packages specified in package.json
RUN npm install

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NODE_ENV=development

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint script to run on container start
ENTRYPOINT ["/entrypoint.sh"]