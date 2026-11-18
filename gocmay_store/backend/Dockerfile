
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy danh sách thư viện
COPY package*.json ./

# Cài các thư viện cho Backend, bao gồm mysql2
RUN npm install --omit=dev

# Copy mã nguồn Backend
COPY server.mjs ./server.mjs

# Chạy bằng user không có quyền root
USER node

EXPOSE 3001

CMD ["node", "server.mjs"]
