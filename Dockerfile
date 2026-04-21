FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 16000

ENV PORT=16000

CMD ["npm", "start"]