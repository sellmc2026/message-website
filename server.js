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

        let contentType = "text/html";

        if (request.url.endsWith(".js")) {
            contentType = "text/javascript";
        }

        if (request.url.endsWith(".css")) {
            contentType = "text/css";
        }

        if (request.url.endsWith(".png")) {
            contentType = "image/png";
        }

        if (request.url.endsWith(".mp3")) {
            contentType = "audio/mpeg";
        }

        response.writeHead(200, {
            "Content-Type": contentType
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

    socket.on("joinRoom", (data) => {

        if (!data || typeof data !== "object") {
            return;
        }

        let code =
            typeof data.code === "string"
                ? data.code.trim().toUpperCase()
                : "";

        let username =
            typeof data.username === "string"
                ? data.username.trim()
                : "";

        if (!code || !username) {
            return;
        }

        if (username.length > 5) {
            return;
        }


        // Leave previous room

        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
        }


        // Save username

        socket.username = username;


        // Join room

        socket.join(code);

        socket.currentRoom = code;


        // Tell everyone that someone joined

        io.to(code).emit("userJoined", username);


        console.log(
            `${username} joined room ${code}`
        );


        // Tell the person who joined

        socket.emit(
            "joinedRoom",
            code
        );

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


        io.to(socket.currentRoom).emit(
            "receiveMessage",
            {
                sender: socket.id,
                username: socket.username,
                text: message
            }
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
