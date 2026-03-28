FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

# build react frontend
RUN npm run build

# port
EXPOSE 3000

# run
CMD ["node", "app.js"]