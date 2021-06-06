# Build the backend application

# Use a base node image from Docker hub
# The node version should match that used in VSCode development & test and should be the LTS version
FROM node:16.3

# Set the image working directory
WORKDIR /backend

# Copy package.json & package.lock.json files
COPY package*.json ./

# Install without dev-dependencies
RUN npm install --only=production

# Copy rest of the application source code
COPY . ./

# Run with '--inspect=9229' if running 'Debug Backend on Kubernetes' launch configuration
# ENTRYPOINT ["node", "--inspect=9229", "dist/src/app.js"]
ENTRYPOINT ["node", "dist/src/app.js"]
