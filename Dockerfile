# Use an official Node runtime as a parent image
FROM node:20

# Install Nginx and Git
RUN apt-get update && apt-get install -y nginx git

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before other files
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NODE_ENV=development

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]