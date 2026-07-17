const { Server } = require('socket.io');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('subscribe:deployment', ({ deploymentId }) => {
      socket.join(`deployment:${deploymentId}`);
    });

    socket.on('unsubscribe:deployment', ({ deploymentId }) => {
      socket.leave(`deployment:${deploymentId}`);
    });
  });
}

function emitDeploymentLog(deploymentId, payload) {
  if (!io) return;
  io.to(`deployment:${deploymentId}`).emit('deployment:log', payload);
}

function emitDeploymentStatus(deploymentId, payload) {
  if (!io) return;
  io.to(`deployment:${deploymentId}`).emit('deployment:status', payload);
}

module.exports = { initSocket, emitDeploymentLog, emitDeploymentStatus };
