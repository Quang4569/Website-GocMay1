FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.mjs ./server.mjs
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3001
CMD ["node", "server.mjs"]
