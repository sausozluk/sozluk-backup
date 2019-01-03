FROM node:10.15.0
ENV NPM_CONFIG_LOGLEVEL warn
COPY . /app
WORKDIR /app
RUN ["yarn"]
CMD ["node", "app"]