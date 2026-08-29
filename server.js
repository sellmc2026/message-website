const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const server = http.createServer((request, response) => {

    const filePath = path.join(
        __dirname,
        "public",
        request.url === "/" ? "index.html" : request.url
    );

    fs.readFile(filePath, (error, data) => {

        if (error) {
            response.writeHead(404);
            response.end("404 - Page not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type": "text/html"
        });

        response.end(data);
    });

});


const io = new Server(server);


io.on("connection", (socket) => {

    console.log("Someone connected!");


    // ========================================
    // JOIN MESSAGE CODE
    // ========================================

    socket.on("joinRoom", (code) => {

        code = code.trim().toUpperCase();

        if (!code) {
            return;
        }


        // Leave any previous room

        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
        }


        // Join the new room

        socket.join(code);

        socket.currentRoom = code;

        console.log(
            `Someone joined room ${code}`
        );


        // Tell the person they successfully joined

        socket.emit("joinedRoom", code);

    });


    // ========================================
    // SEND MESSAGE
    // ========================================

    socket.on("sendMessage", (message) => {

        if (!socket.currentRoom) {
            return;
        }


        if (typeof message !== "string") {
            return;
        }


        message = message.trim();


        if (!message) {
            return;
        }


        // Send the message to everyone
        // in the same Message Code room

        io.to(socket.currentRoom).emit(
            "receiveMessage",
            message
        );

    });


    // ========================================
    // DISCONNECT
    // ========================================

    socket.on("disconnect", () => {

        console.log("Someone disconnected.");

    });

});


server.listen(
    process.env.PORT || 3000,
    () => {

        console.log(
            "Message server is running"
        );

    }
);
