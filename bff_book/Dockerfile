FROM node:latest

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD ["node", "app.js"]