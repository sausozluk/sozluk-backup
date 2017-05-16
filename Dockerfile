FROM node:6.10.3
ENV NPM_CONFIG_LOGLEVEL warn
COPY . /app
WORKDIR /app
RUN ["npm", "install"]
CMD ["node", "app"]