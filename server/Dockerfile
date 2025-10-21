FROM node:trixie-slim

WORKDIR /server

COPY .  ./

RUN npm ci

EXPOSE 3000

CMD [ "node", "server.js" ]