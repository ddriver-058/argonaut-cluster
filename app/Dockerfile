# Dockerfile
FROM node:21

WORKDIR /app/argonaut-cluster

RUN apt-get update

RUN npm i -g @quasar/cli
RUN npm i pinia
RUN npm i vue
RUN npm i vue-router
RUN npm i v-network-graph
RUN npm i vue-codemirror codemirror --save
RUN npm i @codemirror/lang-yaml
RUN npm i @codemirror/theme-one-dark
RUN npm i axios
RUN npm i ws
RUN npm i js-yaml
RUN npm i https
RUN npm i pinia-plugin-persist
RUN npm i lodash


# BASE IMAGE ABOVE

COPY . /app
RUN npm i quasar

RUN quasar build argonaut-cluster

RUN chmod -R 555 /app

USER 1000

CMD ["quasar", "serve", "dist/spa", "--port", "9000", "--hostname", "0.0.0.0", "--history"]