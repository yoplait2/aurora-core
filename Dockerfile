FROM node:latest

RUN npm run --silent build || true

EXPOSE 3002

CMD [ "npm", "run", "prod" ]