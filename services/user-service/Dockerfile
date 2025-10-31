FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

ENV PORT=4001
EXPOSE 4001

CMD ["npm", "start"]
