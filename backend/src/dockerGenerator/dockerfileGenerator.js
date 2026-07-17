function generateDockerfile(framework) {
  switch (framework) {
    case 'Next.js':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD [\"npm\",\"run\",\"start\"]\n`;
    case 'Vite':
    case 'React':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 4173\nCMD [\"npm\",\"run\",\"preview\",\"--\",\"--host\",\"0.0.0.0\"]\n`;
    case 'Express':
    case 'Node':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD [\"node\",\"server.js\"]\n`;
    case 'FastAPI':
      return `FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"uvicorn\",\"main:app\",\"--host\",\"0.0.0.0\",\"--port\",\"8000\"]\n`;
    default:
      return `FROM alpine:3.20\nCMD [\"echo\",\"Unsupported framework\"]\n`;
  }
}

module.exports = { generateDockerfile };
