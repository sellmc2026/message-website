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
