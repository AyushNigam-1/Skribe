import { Server } from "socket.io";

let io: Server;

export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://10.43.186.43:5173/"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("🔌 New Socket Connected:", socket.id);

        // When the frontend connects, it tells the server who it is
        socket.on("setup", (userId: string) => {
            socket.join(userId);
            console.log(`🟢 User ${userId} joined their personal notification room`);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Socket Disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};