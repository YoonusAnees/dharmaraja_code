let io;

export const initSocket = (serverIo) => {
  io = serverIo;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-user-room", (userId) => {
      if (!userId) return;

      socket.join(userId);
      console.log(`User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};