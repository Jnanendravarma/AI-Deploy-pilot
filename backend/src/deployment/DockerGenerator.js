/**
 * DockerGenerator.js
 * Generates production-ready Dockerfile instructions dynamically based on framework.
 */

function generateDockerfile(framework, options = {}) {
  const customBuildCmd = options.buildCommand;
  const customStartCmd = options.startCommand;

  switch (framework) {
    case 'Next.js':
      return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ${customBuildCmd || 'npm run build'}

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['npm', 'run', 'start'])}
`;

    case 'NestJS':
      return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ${customBuildCmd || 'npm run build'}

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['node', 'dist/main.js'])}
`;

    case 'React':
    case 'Vite':
    case 'Vue':
    case 'Nuxt':
    case 'Angular':
      return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ${customBuildCmd || 'npm run build'}

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

    case 'Express':
    case 'Node.js':
      return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
${customBuildCmd ? `RUN ${customBuildCmd}` : ''}
EXPOSE 3000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['node', 'server.js'])}
`;

    case 'FastAPI':
      return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])}
`;

    case 'Django':
    case 'Flask':
    case 'Python':
      return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['python', 'app.py'])}
`;

    case 'Spring Boot':
    case 'Java':
      return `FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
`;

    case 'Laravel':
    case 'PHP':
      return `FROM php:8.2-fpm-alpine
WORKDIR /app
RUN apk add --no-cache composer nginx
COPY . .
RUN composer install --no-dev --optimize-autoloader
EXPOSE 8000
CMD ${JSON.stringify(customStartCmd ? customStartCmd.split(' ') : ['php', 'artisan', 'serve', '--host=0.0.0.0', '--port=8000'])}
`;

    case 'Go':
      return `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
`;

    case 'Rust':
      return `FROM rust:1.75-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/target/release/app .
EXPOSE 8080
CMD ["./app"]
`;

    case 'Static Website':
      return `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

    default:
      return `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
`;
  }
}

module.exports = { generateDockerfile };
