# ==========================================
# Stage 1: Build & Test
# ==========================================
FROM node:22-alpine AS builder

# set working directory for container
WORKDIR /app

# copy package files & install dependencies
COPY package*.json ./
RUN npm install

# copy the entire source code to the container
COPY . .

# run tests
RUN npx jest --coverage --silent --ci

# build project
RUN npx ng build

# ==========================================
# Stage 2: Production (Run)
# ==========================================
FROM node:22-alpine

WORKDIR /app

# We only copy the content from the dist folder so the final image will be very small (ohne node_modules vom Build).
COPY --from=builder /app/dist ./dist

# Angular SSR is using the port 4000.
EXPOSE 4000

# start angular's server
CMD ["node", "./dist/olympia-website-new/server/server.mjs"]
