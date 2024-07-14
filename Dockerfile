FROM ubuntu:22.04 as base

WORKDIR /app

RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    iputils-ping \
    iproute2 \
    unixodbc \
    gcc \
    g++ \
    make

# RUN curl -fsSL https://npm.taobao.org/mirrors/node/latest/deb/node.deb -o node.deb \
#   && dpkg -i node.deb \
#   && rm -f node.deb \
#   && npm install -g yarn

RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/nodesource-archive-keyring.gpg] https://deb.nodesource.com/node_20.x jammy main" | tee /etc/apt/sources.list.d/nodesource.list \
  && echo "deb-src [signed-by=/usr/share/keyrings/nodesource-archive-keyring.gpg] https://deb.nodesource.com/node_20.x jammy main" | tee -a /etc/apt/sources.list.d/nodesource.list \
  && apt-get update && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g yarn

RUN yarn config set registry https://registry.npmmirror.com/

COPY package.json yarn.lock ./

COPY . .

RUN yarn install --ignore-optional

RUN yarn prepare:docker

FROM base as production

WORKDIR /home/dbgatex-docker

COPY --from=base /app/docker .

RUN ["chmod", "+x", "/home/dbgatex-docker/entrypoint.sh"]

EXPOSE 3000
VOLUME /root/.dbgate

#CMD ["/home/dbgatex-docker/entrypoint.sh"]
