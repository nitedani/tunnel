FROM node:17.1.0-alpine3.12
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . ./
USER node
CMD node src/main