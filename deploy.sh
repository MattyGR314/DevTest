# Custom deployment script for Node.js + React app
#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build React app
echo "Building React app..."
npm run build

# Start the server
echo "Starting server..."
node app.js
