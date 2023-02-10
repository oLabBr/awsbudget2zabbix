FROM node:16.15.1

COPY ["package.json", "package-lock.json*", "tsconfig.json", "/app/"]
COPY ["./src/*", "./app/src/"]

WORKDIR /app/
RUN npm install -g typescript
RUN npm install -g ts-node
RUN npm install

CMD [ "ts-node-esm" , "src/app.ts" ]


