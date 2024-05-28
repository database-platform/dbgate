FROM node:16.20.2-alpine3.18 as base

WORKDIR /home/dbgate-docker

ENV NODE_ENV=production

RUN apk --no-cache upgrade \
 && apk --no-cache add  \
    iputils

FROM base as build

COPY package*.json yarn.lock ./

COPY . .

RUN yarn install

# RUN yarn run prepare:docker 

FROM base

COPY --from=build /home/dbgate-docker /home/dbgate-docker
# COPY --from=build /home/dbgate-docker-tmp/entrypoint.sh /home/dbgate-docker/
# COPY --from=build /home/dbgate-docker-tmp/plugins /home/dbgate-docker/
# COPY --from=build /home/dbgate-docker-tmp/public /home/dbgate-docker/
# COPY --from=build /home/dbgate-docker-tmp/node_modules /home/dbgate-docker/
# COPY --from=build /home/dbgate-docker-tmp/bundle.js /home/dbgate-docker/

RUN ["chmod", "+x", "/home/dbgate-docker/entrypoint.sh"]

WORKDIR /home/dbgate-docker
EXPOSE 3000
VOLUME /root/.dbgate

CMD ["/home/dbgate-docker/entrypoint.sh"]
