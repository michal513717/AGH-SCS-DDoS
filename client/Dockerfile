FROM node:trixie-slim

WORKDIR /client

COPY .  ./

RUN npm ci

EXPOSE 3000

CMD [ "node", "client.js" ]