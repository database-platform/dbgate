FROM node:20.12.2-alpine3.19 as base

WORKDIR /app

RUN echo "http://mirrors.ustc.edu.cn/alpine/v3.19/main/" > /etc/apk/repositories \
    && echo "http://mirrors.ustc.edu.cn/alpine/v3.19/community/" >> /etc/apk/repositories \
    && apk --no-cache upgrade \
    && apk add --no-cache iputils \
    && apk add --no-cache build-base \
    make \
    g++ \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*

RUN yarn config set registry https://registry.npmmirror.com/

COPY package.json yarn.lock ./

COPY . .

RUN yarn install --ignore-optional

# RUN yarn run plugins:copydist
# RUN yarn run prepare:docker

FROM base as production

WORKDIR /home/dbgatex-docker

COPY --from=base /app/docker .
# COPY ./docker .

RUN ["chmod", "+x", "/home/dbgatex-docker/entrypoint.sh"]

EXPOSE 3000
VOLUME /root/.dbgate

# CMD ["/home/dbgatex-docker/entrypoint.sh"]

