# INTENTIONALLY INSECURE - SAST test only
FROM node:latest
USER root
ENV DB_PASSWORD=admin123
ADD https://example.com/install.sh /tmp/install.sh
RUN apt-get update && apt-get install -y curl wget && curl http://example.com/setup.sh | sh
RUN chmod -R 777 /app
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 22 3000
CMD ["node", "server.js"]
