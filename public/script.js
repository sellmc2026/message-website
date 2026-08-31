const socket = io();


/* ========================================
   LOCAL MESSAGR DATABASE
   ======================================== */

let messagrDB;

const databaseRequest =
    indexedDB.open("MessagrDB", 1);


databaseRequest.onupgradeneeded =
    function(event) {

        const db =
            event.target.result;


        if (
            !db.objectStoreNames.contains("rooms")
        ) {

            db.createObjectStore(
                "rooms",
                {
                    keyPath: "roomCode"
                }
            );

        }

    };


databaseRequest.onsuccess =
    function(event) {

        messagrDB =
            event.target.result;


        console.log(
            "Messagr local database ready."
        );

    };


databaseRequest.onerror =
    function(event) {

        console.error(
            "Could not open Messagr database:",
            event.target.error
        );

    };


/* ========================================
   ELEMENTS
   ======================================== */

const codeBox =
    document.getElementById("codeBox");


const copyCodeButton =
    document.getElementById("copyCodeButton");


const generateButton =
    document.getElementById("generateButton");


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


const imageInput =
    document.getElementById("imageInput");


const imageButton =
    document.getElementById("imageButton");


const mainProfileButton =
    document.getElementById("profileButton");


const saveChatButton =
    document.getElementById("saveChatButton");


const savedRooms =
    document.getElementById("savedRooms");


/* ========================================
   SAVED USERNAME
   ======================================== */

const savedUsername =
    localStorage.getItem("messagrUsername");


/* ========================================
   IMAGE UPLOAD STATE
   ======================================== */

let imageUploadInProgress =
    false;


let imageUploadTimeout =
    null;


let currentImageLoadingMessage =
    null;


/* ========================================
   MUTE / UNMUTE
   ======================================== */

let muted =
    false;


const audio =
    new Audio("chatSound.mp3");


if (muteButton) {

    muteButton.addEventListener(
        "click",
        function() {

            muted =
                !muted;


            if (muted) {

                if (muteIcon) {

                    muteIcon.src =
                        "mute.png";

                }

            } else {

                if (muteIcon) {

                    muteIcon.src =
                        "unmute.png";

                }

            }

        }
    );

}


/* ========================================
   ROOM CODE
   ======================================== */

const roomCodeCharacters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


function isValidRoomCode(code) {

    return /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(
        code
    );

}


function generateCode() {

    let code =
        "";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        code +=
            roomCodeCharacters[
                Math.floor(
                    Math.random() *
                    roomCodeCharacters.length
                )
            ];

    }


    return (
        code.substring(0, 4)
        + "-"
        + code.substring(4)
    );

}


/* ========================================
   SAVED ROOMS STORAGE
   ======================================== */

function getSavedRooms() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "messagrSavedChats"
            ) || "[]"
        );

    } catch (error) {

        console.error(
            "Could not read saved rooms:",
            error
        );

        return [];

    }

}


/* ========================================
   SAVE ROOMS
   ======================================== */

function setSavedRooms(rooms) {

    localStorage.setItem(
        "messagrSavedChats",
        JSON.stringify(rooms)
    );

}


/* ========================================
   LOAD SAVED ROOMS
   ======================================== */

function loadSavedRooms() {

    if (!savedRooms) {

        return;

    }


    savedRooms.innerHTML =
        "";


    const rooms =
        getSavedRooms();


    if (rooms.length === 0) {

        return;

    }


    rooms.forEach(
        function(code) {

            createSavedRoomElement(
                code
            );

        }
    );

}


/* ========================================
   CREATE SAVED ROOM ELEMENT
   ======================================== */

function createSavedRoomElement(code) {

    if (!savedRooms) {

        return;

    }


    const room =
        document.createElement("div");


    room.classList.add(
        "savedRoom"
    );


    const roomButton =
        document.createElement("button");


    roomButton.classList.add(
        "savedRoomButton"
    );


    roomButton.textContent =
        code;


    roomButton.title =
        "Join " + code;


    roomButton.addEventListener(
        "click",
        function() {

            if (!codeInput) {

                return;

            }


            codeInput.value =
                code;


            updateJoinButton();


            updateSaveChatButton();


            if (joinButton) {

                joinButton.click();

            }

        }
    );


    const deleteButton =
        document.createElement("button");


    deleteButton.classList.add(
        "editRoomButton"
    );


    deleteButton.textContent =
        "✕";


    deleteButton.title =
        "Remove saved room";


    deleteButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();


            removeSavedRoom(
                code
            );

        }
    );


    room.appendChild(
        roomButton
    );


    room.appendChild(
        deleteButton
    );


    savedRooms.appendChild(
        room
    );

}


/* ========================================
   REMOVE SAVED ROOM
   ======================================== */

function removeSavedRoom(code) {

    let rooms =
        getSavedRooms();


    rooms =
        rooms.filter(
            function(savedCode) {

                return savedCode !== code;

            }
        );


    setSavedRooms(
        rooms
    );


    loadSavedRooms();


    updateSaveChatButton();

}


/* ========================================
   UPDATE SAVE CHAT BUTTON
   ======================================== */

function updateSaveChatButton() {

    if (!saveChatButton) {

        return;

    }


    const code =
        codeInput
            ? codeInput.value
                .trim()
                .toUpperCase()
            : "";


    if (
        !isValidRoomCode(code)
    ) {

        saveChatButton.textContent =
            "SAVE CHAT";


        saveChatButton.classList.remove(
            "delete"
        );


        return;

    }


    const rooms =
        getSavedRooms();


    const isSaved =
        rooms.includes(code);


    if (isSaved) {

        saveChatButton.textContent =
            "DELETE CHAT";


        saveChatButton.classList.add(
            "delete"
        );

    } else {

        saveChatButton.textContent =
            "SAVE CHAT";


        saveChatButton.classList.remove(
            "delete"
        );

    }

}


/* ========================================
   SAVE / DELETE CHAT BUTTON
   ======================================== */

if (saveChatButton) {

    saveChatButton.addEventListener(
        "click",
        function() {

            if (!codeInput) {

                return;

            }


            const code =
                codeInput.value
                    .trim()
                    .toUpperCase();


            if (
                !isValidRoomCode(code)
            ) {

                return;

            }


            let rooms =
                getSavedRooms();


            const alreadySaved =
                rooms.includes(code);


            /* ========================================
               DELETE CHAT
               ======================================== */

            if (alreadySaved) {

                rooms =
                    rooms.filter(
                        function(savedCode) {

                            return savedCode !== code;

                        }
                    );


                setSavedRooms(
                    rooms
                );


                loadSavedRooms();


                updateSaveChatButton();


                return;

            }


            /* ========================================
               SAVE CHAT
               ======================================== */

            rooms.push(
                code
            );


            setSavedRooms(
                rooms
            );


            loadSavedRooms();


            updateSaveChatButton();

        }
    );

}


/* ========================================
   LOAD SAVED ROOMS ON PAGE LOAD
   ======================================== */

loadSavedRooms();


/* ========================================
   PROFILE BUTTON
   ======================================== */

if (mainProfileButton) {

    mainProfileButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "messagr-profile.html";

        }
    );

}


/* ========================================
   UPDATE JOIN BUTTON
   ======================================== */

function updateJoinButton() {

    if (
        !codeInput ||
        !joinButton
    ) {

        return;

    }


    const code =
        codeInput.value
            .trim()
            .toUpperCase();


    if (
        isValidRoomCode(code)
    ) {

        joinButton.style.backgroundColor =
            "#4DA6FF";


        joinButton.style.borderColor =
            "#000000";

    } else {

        joinButton.style.backgroundColor =
            "#BEFF8F";


        joinButton.style.borderColor =
            "#000000";

    }

}


/* ========================================
   GENERATE NEW ROOM CODE
   ======================================== */

function generateNewRoomCode() {

    const code =
        generateCode();


    if (codeInput) {

        codeInput.value =
            code;

    }


    if (codeBox) {

        codeBox.textContent =
            code;

    }


    updateJoinButton();


    updateSaveChatButton();


    if (status) {

        status.textContent =
            "New room code generated.";

    }


    if (codeInput) {

        codeInput.focus();

    }

}


/* ========================================
   GENERATE BUTTON
   ======================================== */

if (generateButton) {

    generateButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            generateNewRoomCode();

        }
    );

}


/* ========================================
   FORMAT ROOM CODE WHILE TYPING
   ======================================== */

if (codeInput) {

    codeInput.addEventListener(
        "input",
        function() {

            let value =
                codeInput.value
                    .toUpperCase();


            value =
                value.replace(
                    /[^A-Z2-9]/g,
                    ""
                );


            value =
                value.replace(
                    /[IO01]/g,
                    ""
                );


            value =
                value.substring(
                    0,
                    8
                );


            if (
                value.length > 4
            ) {

                value =
                    value.substring(0, 4)
                    + "-"
                    + value.substring(4);

            }


            codeInput.value =
                value;


            updateJoinButton();


            updateSaveChatButton();

        }
    );

}


/* ========================================
   INITIAL JOIN BUTTON STATE
   ======================================== */

updateJoinButton();


updateSaveChatButton();


/* ========================================
   COPY ROOM CODE
   ======================================== */

if (copyCodeButton) {

    copyCodeButton.addEventListener(
        "click",
        async function() {

            if (!codeBox) {

                return;

            }


            const code =
                codeBox.textContent;


            if (
                !code ||
                code === "----"
            ) {

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    code
                );


                copyCodeButton.textContent =
                    "COPIED!";


                setTimeout(
                    function() {

                        copyCodeButton.textContent =
                            "COPY ROOM CODE";

                    },
                    1000
                );

            } catch (error) {

                console.error(
                    "Could not copy code:",
                    error
                );

            }

        }
    );

}


/* ========================================
   JOIN ROOM
   ======================================== */

if (joinButton) {

    joinButton.addEventListener(
        "click",
        function() {

            /* ========================================
               GET USERNAME
               ======================================== */

            const username =
                (
                    localStorage.getItem(
                        "messagrUsername"
                    ) || ""
                ).trim();


            /* ========================================
               GET ROOM CODE
               ======================================== */

            const code =
                codeInput.value
                    .trim()
                    .toUpperCase();


            /* ========================================
               CHECK USERNAME
               ======================================== */

            if (
                username.length === 0
            ) {

                status.textContent =
                    "Please set a username on the welcome page first.";

                return;

            }


            if (
                username.length > 8
            ) {

                status.textContent =
                    "Username must be 8 characters or less.";

                return;

            }


            /* ========================================
               CHECK ROOM CODE
               ======================================== */

            if (
                !isValidRoomCode(code)
            ) {

                status.textContent =
                    "Please enter a valid room code.";

                codeInput.focus();

                updateJoinButton();

                return;

            }


            /* ========================================
               CHECK SOCKET CONNECTION
               ======================================== */

            if (
                !socket.connected
            ) {

                status.textContent =
                    "Connecting to server...";

                socket.connect();

                return;

            }


            /* ========================================
               SHOW JOINING STATUS
               ======================================== */

            status.textContent =
                "Joining " + code + "...";


            /* ========================================
               SAVE USERNAME
               ======================================== */

            localStorage.setItem(
                "messagrUsername",
                username
            );


            /* ========================================
               JOIN ROOM
               ======================================== */

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

}


/* ========================================
   SUCCESSFULLY JOINED ROOM
   ======================================== */

socket.on(
    "joinedRoom",
    async function(code) {

        console.log(
            "Successfully joined room:",
            code
        );


        /* ========================================
           PUT CURRENT ROOM CODE IN INPUT
           ======================================== */

        if (codeInput) {

            codeInput.value =
                code;

        }


        /* ========================================
           UPDATE STATUS
           ======================================== */

        if (status) {

            status.textContent =
                "Connected to " + code;

        }


        /* ========================================
           SHOW CHAT
           ======================================== */

        if (chat) {

            chat.style.display =
                "flex";

        }


        /* ========================================
           SHOW SAVE CHAT BUTTON
           ======================================== */

        if (saveChatButton) {

            saveChatButton.style.display =
                "block";

        }


        updateSaveChatButton();


        /* ========================================
           FOCUS MESSAGE INPUT
           ======================================== */

        if (messageInput) {

            messageInput.focus();

        }


        /* ========================================
           ENABLE PUSH NOTIFICATIONS
           ======================================== */

        try {

            await registerNotificationSystem(
                code
            );

        } catch (error) {

            console.error(
                "Notification setup failed:",
                error
            );

        }

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
            (
                4 -
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

        const registration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );


        console.log(
            "Service worker registered."
        );


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


        let subscription =
            await registration
                .pushManager
                .getSubscription();


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
   SEND TEXT MESSAGE
   ======================================== */

function sendMessage() {

    if (
        imageUploadInProgress
    ) {

        return;

    }


    if (!messageInput) {

        return;

    }


    const text =
        messageInput.value.trim();


    if (
        text.length === 0
    ) {

        return;

    }


    if (
        !socket.connected
    ) {

        if (status) {

            status.textContent =
                "Not connected to server.";

        }

        return;

    }


    socket.emit(
        "sendMessage",
        text
    );


    messageInput.value =
        "";

}


if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


/* ========================================
   ENTER TO SEND
   ======================================== */

if (messageInput) {

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

}


/* ========================================
   IMAGE BUTTON
   ======================================== */

if (imageButton) {

    imageButton.addEventListener(
        "click",
        function() {

            if (
                imageUploadInProgress
            ) {

                return;

            }


            if (imageInput) {

                imageInput.click();

            }

        }
    );

}


/* ========================================
   IMAGE SELECTED
   ======================================== */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function() {

            const file =
                imageInput.files[0];


            if (!file) {

                return;

            }


            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Please select an image."
                );

                imageInput.value =
                    "";

                return;

            }


            if (
                file.size >
                4 * 1024 * 1024
            ) {

                alert(
                    "Image must be 4 MB or smaller."
                );

                imageInput.value =
                    "";

                return;

            }


            if (
                !socket.connected
            ) {

                alert(
                    "You are not connected to a room."
                );

                imageInput.value =
                    "";

                return;

            }


            if (
                imageUploadInProgress
            ) {

                return;

            }


            imageUploadInProgress =
                true;


            if (messageInput) {

                messageInput.disabled =
                    true;

            }


            if (sendButton) {

                sendButton.disabled =
                    true;

            }


            if (imageButton) {

                imageButton.disabled =
                    true;

            }


            const preview =
                new Image();


            preview.onload =
                function() {

                    let width =
                        preview.naturalWidth;


                    let height =
                        preview.naturalHeight;


                    const maxWidth =
                        250;


                    const maxHeight =
                        250;


                    if (
                        width > maxWidth
                    ) {

                        const ratio =
                            maxWidth / width;


                        width =
                            maxWidth;


                        height =
                            height * ratio;

                    }


                    if (
                        height > maxHeight
                    ) {

                        const ratio =
                            maxHeight / height;


                        height =
                            maxHeight;


                        width =
                            width * ratio;

                    }


                    const loadingMessage =
                        document.createElement("div");


                    loadingMessage.classList.add(
                        "message",
                        "messageMine",
                        "imageLoadingMessage"
                    );


                    loadingMessage.style.width =
                        width + "px";


                    loadingMessage.style.height =
                        height + "px";


                    loadingMessage.style.backgroundColor =
                        "#555555";


                    loadingMessage.style.display =
                        "flex";


                    loadingMessage.style.alignItems =
                        "center";


                    loadingMessage.style.justifyContent =
                        "center";


                    loadingMessage.style.padding =
                        "0";


                    const spinner =
                        document.createElement("div");


                    spinner.classList.add(
                        "imageLoadingSpinner"
                    );


                    spinner.textContent =
                        "⟳";


                    spinner.style.color =
                        "#ffffff";


                    spinner.style.fontSize =
                        "40px";


                    spinner.style.lineHeight =
                        "1";


                    spinner.style.animation =
                        "imageSpinner 1s linear infinite";


                    loadingMessage.appendChild(
                        spinner
                    );


                    if (messages) {

                        messages.appendChild(
                            loadingMessage
                        );


                        messages.scrollTop =
                            messages.scrollHeight;

                    }


                    currentImageLoadingMessage =
                        loadingMessage;


                    imageUploadTimeout =
                        setTimeout(
                            function() {

                                if (
                                    !imageUploadInProgress
                                ) {

                                    return;

                                }


                                imageUploadInProgress =
                                    false;


                                if (
                                    currentImageLoadingMessage
                                ) {

                                    currentImageLoadingMessage.remove();

                                    currentImageLoadingMessage =
                                        null;

                                }


                                if (messageInput) {

                                    messageInput.disabled =
                                        false;

                                }


                                if (sendButton) {

                                    sendButton.disabled =
                                        false;

                                }


                                if (imageButton) {

                                    imageButton.disabled =
                                        false;

                                }


                                showUploadError();


                                imageInput.value =
                                    "";

                            },
                            7000
                        );


                    const reader =
                        new FileReader();


                    reader.onload =
                        function() {

                            if (
                                !imageUploadInProgress
                            ) {

                                return;

                            }


                            socket.emit(
                                "sendImage",
                                {
                                    image:
                                        reader.result,

                                    type:
                                        file.type
                                }
                            );

                        };


                    reader.onerror =
                        function() {

                            if (
                                imageUploadTimeout
                            ) {

                                clearTimeout(
                                    imageUploadTimeout
                                );

                                imageUploadTimeout =
                                    null;

                            }


                            imageUploadInProgress =
                                false;


                            if (
                                currentImageLoadingMessage
                            ) {

                                currentImageLoadingMessage.remove();

                                currentImageLoadingMessage =
                                    null;

                            }


                            if (messageInput) {

                                messageInput.disabled =
                                    false;

                            }


                            if (sendButton) {

                                sendButton.disabled =
                                    false;

                            }


                            if (imageButton) {

                                imageButton.disabled =
                                    false;

                            }


                            showUploadError();

                        };


                    reader.readAsDataURL(
                        file
                    );

                };


            preview.onerror =
                function() {

                    imageUploadInProgress =
                        false;


                    if (messageInput) {

                        messageInput.disabled =
                            false;

                    }


                    if (sendButton) {

                        sendButton.disabled =
                            false;

                    }


                    if (imageButton) {

                        imageButton.disabled =
                            false;

                    }


                    showUploadError();

                };


            preview.src =
                URL.createObjectURL(file);


            imageInput.value =
                "";

        }
    );

}


/* ========================================
   UPLOAD ERROR
   ======================================== */

function showUploadError() {

    const error =
        document.createElement("div");


    error.classList.add(
        "uploadError"
    );


    error.textContent =
        "Error: Could not send file";


    document.body.appendChild(
        error
    );


    setTimeout(
        function() {

            error.classList.add(
                "hide"
            );


            setTimeout(
                function() {

                    error.remove();

                },
                300
            );

        },
        3000
    );

}


/* ========================================
   RECEIVE TEXT MESSAGE
   ======================================== */

socket.on(
    "receiveMessage",
    function(data) {

        const message =
            document.createElement("div");


        message.classList.add(
            "message"
        );


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

        } else {

            message.classList.add(
                "messageOther"
            );


            message.textContent =
                "[" +
                data.username +
                ": " +
                data.text +
                "]";


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


        if (messages) {

            messages.appendChild(
                message
            );


            messages.scrollTop =
                messages.scrollHeight;

        }

    }
);


/* ========================================
   RECEIVE IMAGE
   ======================================== */

socket.on(
    "receiveImage",
    function(data) {

        if (
            !data ||
            !data.image
        ) {

            return;

        }


        if (
            data.sender === socket.id
        ) {

            if (
                imageUploadTimeout
            ) {

                clearTimeout(
                    imageUploadTimeout
                );

                imageUploadTimeout =
                    null;

            }


            imageUploadInProgress =
                false;


            if (
                currentImageLoadingMessage
            ) {

                currentImageLoadingMessage.remove();

                currentImageLoadingMessage =
                    null;

            }


            if (messageInput) {

                messageInput.disabled =
                    false;

            }


            if (sendButton) {

                sendButton.disabled =
                    false;

            }


            if (imageButton) {

                imageButton.disabled =
                    false;

            }

        }


        const message =
            document.createElement("div");


        message.classList.add(
            "message"
        );


        if (
            data.sender === socket.id
        ) {

            message.classList.add(
                "messageMine"
            );

        } else {

            message.classList.add(
                "messageOther"
            );

        }


        const image =
            document.createElement("img");


        image.src =
            data.image;


        image.alt =
            "Image sent by " +
            (data.username || "user");


        image.style.maxWidth =
            "250px";


        image.style.maxHeight =
            "250px";


        image.style.width =
            "auto";


        image.style.height =
            "auto";


        image.style.borderRadius =
            "8px";


        image.style.display =
            "block";


        image.style.objectFit =
            "contain";


        message.appendChild(
            image
        );


        if (messages) {

            messages.appendChild(
                message
            );


            messages.scrollTop =
                messages.scrollHeight;

        }


        if (
            data.sender !== socket.id &&
            !muted
        ) {

            audio.currentTime =
                0;


            audio.play().catch(
                function() {}
            );

        }

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


        if (messages) {

            messages.appendChild(
                message
            );


            messages.scrollTop =
                messages.scrollHeight;

        }

    }
);


/* ========================================
   CONNECTION STATUS
   ======================================== */

socket.on(
    "connect",
    function() {

        console.log(
            "Connected to server:",
            socket.id
        );

    }
);


socket.on(
    "disconnect",
    function() {

        console.log(
            "Disconnected from server."
        );


        if (
            imageUploadInProgress
        ) {

            if (
                imageUploadTimeout
            ) {

                clearTimeout(
                    imageUploadTimeout
                );

                imageUploadTimeout =
                    null;

            }


            imageUploadInProgress =
                false;


            if (
                currentImageLoadingMessage
            ) {

                currentImageLoadingMessage.remove();

                currentImageLoadingMessage =
                    null;

            }


            if (messageInput) {

                messageInput.disabled =
                    false;

            }


            if (sendButton) {

                sendButton.disabled =
                    false;

            }


            if (imageButton) {

                imageButton.disabled =
                    false;

            }

        }

    }
);
