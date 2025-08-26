FROM node:20-alpine AS builder

WORKDIR /auth_api

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS prod-stage

COPY --from=build-stage /auth_api/dist /auth_api/dist
COPY --from=build-stage /auth_api/package.json /auth_api/package.json

WORKDIR /auth_api

RUN npm install --production

CMD ["npm", "run", "start:prod"]