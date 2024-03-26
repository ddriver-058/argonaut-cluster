# Dockerfile
# FROM node:21

# WORKDIR /api

# RUN apt-get update
# RUN apt-get install -y ansible
# RUN apt-get install -y sshpass
# RUN apt-get install -y iputils-ping

# RUN npm i koa
# RUN npm i koa-router
# RUN npm i koa-websocket
# RUN npm i koa-bodyparser
# RUN npm install @koa/cors --save
# RUN npm i ws
# RUN npm i handlebars
# RUN npm i js-yaml
# RUN npm i child_process
# RUN npm i dotenv
# RUN npm i tmp
# RUN npm i class-validator
# RUN npm i --save data-forge
# RUN npm i crypto
# RUN npm i jsonwebtoken
# RUN npm i tailing-stream
# RUN npm i lodash
# RUN npm i axios

# # Ensures ansible sees correct encoding in bash
# RUN echo export LC_ALL="C.UTF-8" > ~/.bashrc
# RUN echo export ANSIBLE_HOST_KEY_CHECKING=False >> ~/.bashrc
# RUN echo export ANSIBLE_STDOUT_CALLBACK=yaml >> ~/.bashrc

# Uncomment the above and comment this statement to rebuild base image.
FROM ddriver058/argonaut-cluster-api:0.0.1

COPY . /api

RUN mkdir -p /etc/ansible
RUN chmod -R 555 /api
RUN chmod 777 /etc/ansible
RUN chmod 777 /api/templating/argonaut_cluster.yaml
RUN chmod 777 /api/logs

USER 1000

CMD ["node", "api.js"]
