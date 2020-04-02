FROM node:12-buster

RUN apt-get update -y && \
  apt-get install -y \
  build-essential \
  libxi-dev \
  libglu1-mesa-dev \
  libglew-dev \
  pkg-config

WORKDIR /srv/rainbow-options/
COPY client ./client
COPY server ./server

# Client Build
RUN \
  cd /srv/rainbow-options/client && \
  yarn install && \
  yarn test --watchAll=false && \
  yarn build

# Server Build/Run
RUN \
  cd /srv/rainbow-options/server && \
  yarn install && \
  yarn test

CMD \
  cd /srv/rainbow-options/server && \
  yarn start
