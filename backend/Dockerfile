FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD ["sh", "-c", "npx prisma db push && npm run seed && npm start"]
