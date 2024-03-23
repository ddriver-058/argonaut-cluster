FROM nginx:latest
RUN openssl genrsa -out server.key 2048
RUN openssl req -new -key server.key -out server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
RUN openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
RUN mkdir -p /etc/nginx/certs
RUN cp server.crt /etc/nginx/certs/server.crt
RUN cp server.key /etc/nginx/certs/server.key
COPY nginx.conf /etc/nginx/nginx.conf