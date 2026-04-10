import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export const connectRealtime = ({ role, userId }) => {
  if (!role || !userId) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
  }

  const registerCurrentUser = () => {
    socket.emit("register", { role, userId });
  };

  if (socket.connected) {
    registerCurrentUser();
  }

  socket.off("connect", registerCurrentUser);
  socket.on("connect", registerCurrentUser);

  return socket;
};

export const disconnectRealtime = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const getSocket = () => socket;
