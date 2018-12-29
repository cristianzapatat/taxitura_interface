FROM node:dubnium
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

RUN npm i -g @adonisjs/cli
RUN npm i

EXPOSE 80
ENV TZ UTC

CMD ["sh", "start.sh"]