# Use an official lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching layers)
COPY package*.json ./

# Install production dependencies cleanly
RUN npm ci --only=production

# Copy the rest of your backend source code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]