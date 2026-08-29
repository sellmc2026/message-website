const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log("Someone connected!");

    socket.on("disconnect", () => {
        console.log("Someone disconnected!");
    });
});

server.listen(3000, () => {
    console.log("Message server running on port 3000");
});

server.listen(3000, () => {
    console.log("Message server running on port 3000");
});
