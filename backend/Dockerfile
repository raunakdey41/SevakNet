FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all deps including devDependencies for nodemon
RUN npm install

# Copy schema and all app files
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 4000

# Use entrypoint to run schema + seed + server
ENTRYPOINT ["sh", "entrypoint.sh"]
