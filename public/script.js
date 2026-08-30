const socket = io();






const imageInput =
    document.getElementById("imageInput");

const imageButton =
    document.getElementById("imageButton");

imageButton.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {

    const file =
        imageInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select an image.");

        imageInput.value = "";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        alert("Image must be smaller than 5 MB.");

        imageInput.value = "";

        return;
    }

    console.log(
        "Selected image:",
        file.name
    );

});

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


    for (
        let i = 0;
        i < 8;
        i++
    ) {

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


        if (
            code === "----"
        ) {
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


        /* Username required */

        if (
            username.length === 0
        ) {

            status.textContent =
                "Please enter a username.";

            usernameInput.focus();

            return;
        }


        /* Username maximum length */

        if (
            username.length > 5
        ) {

            status.textContent =
                "Username must be 5 characters or less.";

            usernameInput.focus();

            return;
        }


        /* Message Code required */

        if (
            code.length === 0
        ) {

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
                code:
                    code,

                username:
                    username
            }
        );

    }
);


/* ========================================
   BROWSER PUSH NOTIFICATIONS
   ======================================== */

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (4 -
                base64String.length % 4
            ) % 4
        );


    const base64 =
        (
            base64String +
            padding
        )
        .replace(
            /-/g,
            "+"
        )
        .replace(
            /_/g,
            "/"
        );


    const rawData =
        window.atob(base64);


    const outputArray =
        new Uint8Array(
            rawData.length
        );


    for (
        let i = 0;
        i < rawData.length;
        ++i
    ) {

        outputArray[i] =
            rawData.charCodeAt(i);

    }


    return outputArray;

}


async function registerNotificationSystem(
    roomCode
) {

    if (
        !("serviceWorker" in navigator)
    ) {

        console.log(
            "Service workers are not supported."
        );

        return;

    }


    if (
        !("PushManager" in window)
    ) {

        console.log(
            "Push notifications are not supported."
        );

        return;

    }


    try {

        /* Register service worker */

        const registration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );


        console.log(
            "Service worker registered."
        );


        /* Ask permission */

        const permission =
            await Notification.requestPermission();


        if (
            permission !== "granted"
        ) {

            console.log(
                "Notification permission was not granted."
            );

            return;

        }


        /* Get VAPID public key */

        const keyResponse =
            await fetch(
                "/api/vapid-public-key"
            );


        if (
            !keyResponse.ok
        ) {

            throw new Error(
                "Could not get VAPID public key."
            );

        }


        const publicKey =
            await keyResponse.text();


        if (
            !publicKey
        ) {

            throw new Error(
                "VAPID public key is empty."
            );

        }


        /* Check existing subscription */

        let subscription =
            await registration
                .pushManager
                .getSubscription();


        /* Create subscription */

        if (
            !subscription
        ) {

            subscription =
                await registration
                    .pushManager
                    .subscribe(
                        {
                            userVisibleOnly:
                                true,

                            applicationServerKey:
                                urlBase64ToUint8Array(
                                    publicKey
                                )
                        }
                    );

        }


        /* Save subscription */

        const saveResponse =
            await fetch(
                "/api/save-subscription",
                {
                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/json"
                        },

                    body:
                        JSON.stringify(
                            {
                                subscription:
                                    subscription,

                                socketId:
                                    socket.id,

                                room:
                                    roomCode
                            }
                        )
                }
            );


        if (
            !saveResponse.ok
        ) {

            throw new Error(
                "Server rejected push subscription."
            );

        }


        console.log(
            "Push notifications enabled!"
        );


    } catch (error) {

        console.error(
            "Notification setup failed:",
            error
        );

    }

}


/* ========================================
   SUCCESSFULLY JOINED ROOM
   ======================================== */

socket.on(
    "joinedRoom",
    async function(code) {

        status.textContent =
            "Connected to " + code;


        chat.style.display =
            "flex";


        messageInput.focus();


        /*
           Now that we know the room,
           register the push subscription.
        */

        await registerNotificationSystem(
            code
        );

    }
);


/* ========================================
   SEND MESSAGE
   ======================================== */

function sendMessage() {

    const text =
        messageInput.value.trim();


    if (
        text.length === 0
    ) {
        return;
    }


    socket.emit(
        "sendMessage",
        text
    );


    messageInput.value =
        "";

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

        if (
            event.key === "Enter"
        ) {

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

        if (
            data.sender === socket.id
        ) {

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


            /* Message sound */

            if (
                !muted
            ) {

                audio.currentTime =
                    0;


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
            username +
            " joined the room.";


        messages.appendChild(
            message
        );


        messages.scrollTop =
            messages.scrollHeight;

    }
);









