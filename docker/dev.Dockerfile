FROM node:20-alpine

WORKDIR /usr/src/app

COPY server/package*.json ./

RUN npm install

COPY server/ ./

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
