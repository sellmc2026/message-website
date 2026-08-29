const socket = io();


/* ========================================
   ELEMENTS
   ======================================== */

const codeBox =
    document.getElementById("codeBox");

const copyCodeButton =
    document.getElementById("copyCodeButton");

const generateButton =
    document.getElementById("generateButton");

const usernameInput =
    document.getElementById("usernameInput");

const codeInput =
    document.getElementById("codeInput");

const joinButton =
    document.getElementById("joinButton");

const status =
    document.getElementById("status");

const chat =
    document.getElementById("chat");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const messages =
    document.getElementById("messages");

const muteButton =
    document.getElementById("muteButton");

const muteIcon =
    document.getElementById("muteIcon");


/* ========================================
   MUTE / UNMUTE
   ======================================== */

let muted = false;

const audio =
    new Audio("chatSound.mp3");


muteButton.addEventListener(
    "click",
    function() {

        muted = !muted;


        if (muted) {

            muteIcon.src =
                "mute.png";

        } else {

            muteIcon.src =
                "unmute.png";

        }

    }
);


/* ========================================
   GENERATE MESSAGE CODE
   ======================================== */

function generateCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";


    for (let i = 0; i < 8; i++) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

    }


    return (
        code.substring(0, 4)
        + "-"
        + code.substring(4)
    );

}


generateButton.addEventListener(
    "click",
    function() {

        const code =
            generateCode();


        codeBox.textContent =
            code;


        codeInput.value =
            code;


        status.textContent =
            "Code generated.";

    }
);


/* ========================================
   COPY MESSAGE CODE
   ======================================== */

copyCodeButton.addEventListener(
    "click",
    async function() {

        const code =
            codeBox.textContent;


        if (code === "----") {
            return;
        }


        await navigator.clipboard.writeText(
            code
        );


        copyCodeButton.textContent =
            "COPIED!";


        setTimeout(
            function() {

                copyCodeButton.textContent =
                    "COPY CODE";

            },
            1000
        );

    }
);


/* ========================================
   JOIN ROOM
   ======================================== */

joinButton.addEventListener(
    "click",
    function() {

        const username =
            usernameInput.value.trim();

        const code =
            codeInput.value
                .trim()
                .toUpperCase();


        if (username.length === 0) {

            status.textContent =
                "Please enter a username.";

            usernameInput.focus();

            return;
        }


        if (username.length > 5) {

            status.textContent =
                "Username must be 5 characters or less.";

            usernameInput.focus();

            return;
        }


        if (code.length === 0) {

            status.textContent =
                "Enter a Message Code.";

            codeInput.focus();

            return;
        }


        status.textContent =
            "Joining " + code + "...";


        socket.emit(
            "joinRoom",
            {
                code: code,
                username: username
            }
        );

    }
);


/* ========================================
   SUCCESSFULLY JOINED ROOM
   ======================================== */

socket.on(
    "joinedRoom",
    function(code) {

        status.textContent =
            "Connected to " + code;


        chat.style.display =
            "flex";


        messageInput.focus();

    }
);


/* ========================================
   SEND MESSAGE
   ======================================== */

function sendMessage() {

    const text =
        messageInput.value.trim();


    if (text.length === 0) {
        return;
    }


    socket.emit(
        "sendMessage",
        text
    );


    messageInput.value = "";

}


sendButton.addEventListener(
    "click",
    sendMessage
);


/* ========================================
   ENTER TO SEND
   ======================================== */

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* ========================================
   RECEIVE MESSAGE
   ======================================== */

socket.on(
    "receiveMessage",
    function(data) {

        const message =
            document.createElement("div");


        message.classList.add(
            "message"
        );


        /* ========================================
           YOUR MESSAGE
           ======================================== */

        if (data.sender === socket.id) {

            message.classList.add(
                "messageMine"
            );


            message.textContent =
                "[" +
                data.text +
                "]";

        }


        /* ========================================
           OTHER PERSON'S MESSAGE
           ======================================== */

        else {

            message.classList.add(
                "messageOther"
            );


            message.textContent =
                "[" +
                data.username +
                ": " +
                data.text +
                "]";


            /* ========================================
               MESSAGE SOUND
               ======================================== */

            if (!muted) {

                audio.currentTime = 0;

                audio.play().catch(
                    function() {}
                );

            }

        }


        messages.appendChild(
            message
        );


        messages.scrollTop =
            messages.scrollHeight;

    }
);


/* ========================================
   USER JOINED
   ======================================== */

socket.on(
    "userJoined",
    function(username) {

        const message =
            document.createElement("div");


        message.classList.add(
            "systemMessage"
        );


        message.textContent =
            username + " joined the room.";


        messages.appendChild(
            message
        );


        messages.scrollTop =
            messages.scrollHeight;

    }
);


/* ========================================
   BROWSER NOTIFICATIONS
   ======================================== */

async function registerNotificationSystem() {

    if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
    ) {

        console.log(
            "Push notifications are not supported."
        );

        return;

    }


    try {

        /* Register sw.js */

        const registration =
            await navigator.serviceWorker.register(
                "sw.js"
            );


        console.log(
            "Notification service worker registered."
        );


        /* Ask for notification permission */

        const permission =
            await Notification.requestPermission();


        if (permission !== "granted") {

            console.log(
                "Notification permission was not granted."
            );

            return;

        }


        /* Check if already subscribed */

        let subscription =
            await registration.pushManager.getSubscription();


        /* Create subscription if needed */

        if (!subscription) {

            subscription =
                await registration.pushManager.subscribe({

                    userVisibleOnly: true,

                    applicationServerKey:
                        "YOUR_PUBLIC_VAPID_KEY"

                });

        }


        /* Send subscription to server */

        await fetch(
            "/api/save-subscription",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(subscription)

            }
        );


        console.log(
            "Push notifications enabled."
        );


    } catch (error) {

        console.error(
            "Notification setup failed:",
            error
        );

    }

}


registerNotificationSystem();










