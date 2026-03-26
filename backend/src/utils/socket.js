let io = null;

const buildRoomName = (role, userId) => `${role}:${String(userId)}`;

const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on("connection", (socket) => {
    socket.on("register", ({ role, userId }) => {
      if (!role || !userId) return;
      socket.join(buildRoomName(role, userId));
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected from Socket.IO");
    });
  });
};

const emitToUser = ({ role, userId, event, payload }) => {
  if (!io || !role || !userId || !event) return;
  io.to(buildRoomName(role, userId)).emit(event, payload);
};

module.exports = {
  initSocket,
  emitToUser,
};
