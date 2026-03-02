# Use stable Node 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of project
COPY . .

# Expose Next.js port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]