FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# copy source code and compile TypeScript to JavaScript
COPY . .
RUN npm run build


FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# install only production dependencies — no typescript, no nodemon
RUN npm install --only=production

# copy compiled JS from builder stage
COPY --from=builder /app/dist ./dist

# copy lua scripts where the compiled code expects them at runtime
COPY --from=builder /app/src/scripts ./dist/scripts

EXPOSE 3001

# run the compiled JS directly — no ts-node needed in production
CMD ["node", "dist/server.js"]