# Docker Parent Image with Node 
FROM node:16

WORKDIR /app

COPY ./package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ENTRYPOINT ["node", "--max_old_space_size=1024", "dist/src/main.js"]
