FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Vite needs --host to accept connections from the host machine
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
