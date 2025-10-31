FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

ENV PORT=4003
EXPOSE 4003

CMD ["npm", "start"]
