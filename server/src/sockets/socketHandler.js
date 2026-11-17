export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    // User joins personal room for real-time notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        socket.userId = userId;
      }
    });

    // User joins specific task conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userName, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userName,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      // Cleanup
    });
  });
}
