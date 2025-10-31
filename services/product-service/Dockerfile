FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

ENV PORT=4002
EXPOSE 4002

CMD ["npm", "start"]
