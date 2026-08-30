const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const webpush = require("web-push");


/* ========================================
   WEB PUSH
   ======================================== */

const VAPID_PUBLIC_KEY =
    process.env.VAPID_PUBLIC_KEY;

const VAPID_PRIVATE_KEY =
    process.env.VAPID_PRIVATE_KEY;


if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {

    console.error(
        "ERROR: VAPID keys are missing."
    );

} else {

    webpush.setVapidDetails(
        "mailto:notifications@example.com",
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );

}


/* ========================================
   PUSH SUBSCRIPTIONS
   ======================================== */

/*
   endpoint ->
   {
       subscription,
       room,
       socketId
   }
*/

const pushSubscriptions =
    new Map();


/* ========================================
   HTTP SERVER
   ======================================== */

const server =
    http.createServer(
        async (request, response) => {

            /* ========================================
               VAPID PUBLIC KEY
               ======================================== */

            if (
                request.url ===
                "/api/vapid-public-key"
            ) {

                response.writeHead(
                    200,
                    {
                        "Content-Type":
                            "text/plain"
                    }
                );

                response.end(
                    VAPID_PUBLIC_KEY || ""
                );

                return;
            }


            /* ========================================
               SAVE PUSH SUBSCRIPTION
               ======================================== */

            if (
                request.url ===
                    "/api/save-subscription" &&
                request.method === "POST"
            ) {

                let body = "";


                request.on(
                    "data",
                    chunk => {

                        body += chunk;

                    }
                );


                request.on(
                    "end",
                    () => {

                        try {

                            const data =
                                JSON.parse(body);


                            const subscription =
                                data.subscription;

                            const socketId =
                                data.socketId;

                            const room =
                                typeof data.room ===
                                "string"
                                    ? data.room
                                    : "";


                            if (
                                !subscription ||
                                !subscription.endpoint ||
                                !socketId ||
                                !room
                            ) {

                                response.writeHead(
                                    400,
                                    {
                                        "Content-Type":
                                            "application/json"
                                    }
                                );

                                response.end(
                                    JSON.stringify({
                                        success: false
                                    })
                                );

                                return;
                            }


                            /*
                               Make sure this socket
                               really belongs to this room.
                            */

                            const socket =
                                io.sockets.sockets.get(
                                    socketId
                                );


                            if (
                                !socket ||
                                socket.currentRoom !== room
                            ) {

                                response.writeHead(
                                    403,
                                    {
                                        "Content-Type":
                                            "application/json"
                                    }
                                );

                                response.end(
                                    JSON.stringify({
                                        success: false
                                    })
                                );

                                return;
                            }


                            pushSubscriptions.set(
                                subscription.endpoint,
                                {
                                    subscription:
                                        subscription,

                                    room:
                                        room,

                                    socketId:
                                        socketId
                                }
                            );


                            console.log(
                                "Push subscription saved for room " +
                                room
                            );


                            response.writeHead(
                                201,
                                {
                                    "Content-Type":
                                        "application/json"
                                }
                            );

                            response.end(
                                JSON.stringify({
                                    success: true
                                })
                            );


                        } catch (error) {

                            console.error(
                                "Subscription error:",
                                error
                            );


                            response.writeHead(
                                400,
                                {
                                    "Content-Type":
                                        "application/json"
                                }
                            );

                            response.end(
                                JSON.stringify({
                                    success: false
                                })
                            );

                        }

                    }
                );


                return;
            }


            /* ========================================
               NORMAL WEBSITE FILES
               ======================================== */

            let requestedPath =
                request.url.split("?")[0];


            if (
                requestedPath === "/"
            ) {

                requestedPath =
                    "/index.html";

            }


            /*
               Prevent paths such as ../
            */

            const safePath =
                path.normalize(
                    requestedPath
                );


            if (
                safePath.includes("..")
            ) {

                response.writeHead(
                    403
                );

                response.end(
                    "403 - Forbidden"
                );

                return;
            }


            const filePath =
                path.join(
                    __dirname,
                    "public",
                    safePath
                );


            fs.readFile(
                filePath,
                (error, data) => {

                    if (error) {

                        response.writeHead(
                            404
                        );

                        response.end(
                            "404 - Page not found"
                        );

                        return;
                    }


                    let contentType =
                        "text/html";


                    if (
                        requestedPath.endsWith(
                            ".js"
                        )
                    ) {

                        contentType =
                            "application/javascript";

                    } else if (
                        requestedPath.endsWith(
                            ".css"
                        )
                    ) {

                        contentType =
                            "text/css";

                    } else if (
                        requestedPath.endsWith(
                            ".png"
                        )
                    ) {

                        contentType =
                            "image/png";

                    } else if (
                        requestedPath.endsWith(
                            ".jpg"
                        ) ||
                        requestedPath.endsWith(
                            ".jpeg"
                        )
                    ) {

                        contentType =
                            "image/jpeg";

                    } else if (
                        requestedPath.endsWith(
                            ".gif"
                        )
                    ) {

                        contentType =
                            "image/gif";

                    } else if (
                        requestedPath.endsWith(
                            ".webp"
                        )
                    ) {

                        contentType =
                            "image/webp";

                    } else if (
                        requestedPath.endsWith(
                            ".mp3"
                        )
                    ) {

                        contentType =
                            "audio/mpeg";

                    } else if (
                        requestedPath.endsWith(
                            ".ico"
                        )
                    ) {

                        contentType =
                            "image/x-icon";

                    }


                    response.writeHead(
                        200,
                        {
                            "Content-Type":
                                contentType
                        }
                    );


                    response.end(
                        data
                    );

                }
            );

        }
    );


/* ========================================
   SOCKET.IO
   ======================================== */

const io =
    new Server(server, {
        maxHttpBufferSize: 10 * 1024 * 1024
    });


/* ========================================
   SOCKET CONNECTION
   ======================================== */

io.on(
    "connection",
    (socket) => {

        console.log(
            "Someone connected!"
        );


        /* ========================================
           JOIN MESSAGE CODE
           ======================================== */

        socket.on(
            "joinRoom",
            (data) => {

                if (
                    !data ||
                    typeof data !== "object"
                ) {

                    return;

                }


                let code =
                    typeof data.code ===
                    "string"
                        ? data.code
                            .trim()
                            .toUpperCase()
                        : "";


                let username =
                    typeof data.username ===
                    "string"
                        ? data.username.trim()
                        : "";


                if (
                    !code ||
                    !username
                ) {

                    return;

                }


                if (
                    username.length > 5
                ) {

                    return;

                }


                /* ========================================
                   LEAVE PREVIOUS ROOM
                   ======================================== */

                if (
                    socket.currentRoom
                ) {

                    socket.leave(
                        socket.currentRoom
                    );

                }


                /* ========================================
                   SAVE USERNAME
                   ======================================== */

                socket.username =
                    username;


                /* ========================================
                   JOIN ROOM
                   ======================================== */

                socket.join(
                    code
                );


                socket.currentRoom =
                    code;


                /* ========================================
                   TELL EVERYONE SOMEONE JOINED
                   ======================================== */

                io.to(code).emit(
                    "userJoined",
                    username
                );


                console.log(
                    `${username} joined room ${code}`
                );


                /* ========================================
                   TELL PERSON WHO JOINED
                   ======================================== */

                socket.emit(
                    "joinedRoom",
                    code
                );

            }
        );


        /* ========================================
           SEND TEXT MESSAGE
           ======================================== */

        socket.on(
            "sendMessage",
            async (message) => {

                if (
                    !socket.currentRoom
                ) {

                    return;

                }


                if (
                    typeof message !==
                    "string"
                ) {

                    return;

                }


                message =
                    message.trim();


                if (
                    !message
                ) {

                    return;

                }


                /* ========================================
                   NORMAL CHAT MESSAGE
                   ======================================== */

                io.to(
                    socket.currentRoom
                ).emit(
                    "receiveMessage",
                    {
                        sender:
                            socket.id,

                        username:
                            socket.username,

                        text:
                            message
                    }
                );


                /* ========================================
                   PUSH NOTIFICATIONS
                   ======================================== */

                if (
                    !VAPID_PUBLIC_KEY ||
                    !VAPID_PRIVATE_KEY
                ) {

                    return;

                }


                for (
                    const [
                        endpoint,
                        saved
                    ]
                    of pushSubscriptions
                ) {

                    /*
                       Only notify people
                       in the same room.
                    */

                    if (
                        saved.room !==
                        socket.currentRoom
                    ) {

                        continue;

                    }


                    /*
                       Don't notify the
                       person who sent it.
                    */

                    if (
                        saved.socketId ===
                        socket.id
                    ) {

                        continue;

                    }


                    try {

                        await webpush.sendNotification(
                            saved.subscription,

                            JSON.stringify({
                                username:
                                    socket.username,

                                text:
                                    message
                            })
                        );


                        console.log(
                            "Push notification sent."
                        );


                    } catch (error) {

                        console.error(
                            "Push notification failed:",
                            error.statusCode,
                            error.message
                        );


                        /*
                           404 / 410 usually means
                           the subscription is no
                           longer valid.
                        */

                        if (
                            error.statusCode ===
                                404 ||
                            error.statusCode ===
                                410
                        ) {

                            pushSubscriptions.delete(
                                endpoint
                            );

                        }

                    }

                }

            }
        );


        /* ========================================
           SEND IMAGE
           ======================================== */

        socket.on(
            "sendImage",
            (data) => {

                /* ========================================
                   MAKE SURE USER IS IN A ROOM
                   ======================================== */

                if (
                    !socket.currentRoom
                ) {

                    return;

                }


                /* ========================================
                   VALIDATE DATA
                   ======================================== */

                if (
                    !data ||
                    typeof data !== "object"
                ) {

                    return;

                }


                if (
                    !data.image ||
                    !data.type
                ) {

                    return;

                }


                /* ========================================
                   ONLY ALLOW IMAGES
                   ======================================== */

                if (
                    typeof data.type !==
                        "string" ||
                    !data.type.startsWith(
                        "image/"
                    )
                ) {

                    return;

                }


                /* ========================================
                   SEND IMAGE TO ROOM
                   ======================================== */

                io.to(
                    socket.currentRoom
                ).emit(
                    "receiveImage",
                    {
                        sender:
                            socket.id,

                        username:
                            socket.username,

                        image:
                            data.image,

                        type:
                            data.type
                    }
                );


                console.log(
                    `${socket.username} sent an image in room ${socket.currentRoom}`
                );

            }
        );


        /* ========================================
           DISCONNECT
           ======================================== */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Someone disconnected."
                );


                /*
                   IMPORTANT:
                   We do NOT delete the push
                   subscription here.

                   This allows notifications
                   to work when the user closes
                   the webpage.
                */

            }
        );

    }
);


/* ========================================
   START SERVER
   ======================================== */

server.listen(
    process.env.PORT || 3000,
    "0.0.0.0",
    () => {

        console.log(
            "Message server is running"
        );

    }
);
