/* ========================================
   SAVED ROOMS
   ======================================== */

const savedRooms =
    document.getElementById("savedRooms");


/* ========================================
   LOAD SAVED ROOMS
   ======================================== */

function loadSavedRooms() {

    if (!savedRooms) {

        return;

    }


    savedRooms.innerHTML =
        "";


    const savedChats =
        JSON.parse(
            localStorage.getItem(
                "messagrSavedChats"
            ) || "[]"
        );


    if (savedChats.length === 0) {

        savedRooms.innerHTML =
            `
                <div class="friendEmpty">
                    No saved rooms yet.
                </div>
            `;

        return;

    }


    savedChats.forEach(
        function(code) {

            createSavedRoomElement(
                code
            );

        }
    );

}


/* ========================================
   CREATE SAVED ROOM
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


    roomButton.addEventListener(
        "click",
        function() {

            codeInput.value =
                code;


            updateJoinButton();


            joinButton.click();

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

    let savedChats =
        JSON.parse(
            localStorage.getItem(
                "messagrSavedChats"
            ) || "[]"
        );


    savedChats =
        savedChats.filter(
            function(savedCode) {

                return savedCode !== code;

            }
        );


    localStorage.setItem(
        "messagrSavedChats",
        JSON.stringify(savedChats)
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
        codeInput.value
            .trim()
            .toUpperCase();


    const savedChats =
        JSON.parse(
            localStorage.getItem(
                "messagrSavedChats"
            ) || "[]"
        );


    const isSaved =
        savedChats.includes(code);


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

const saveChatButton =
    document.getElementById(
        "saveChatButton"
    );


if (saveChatButton) {

    saveChatButton.addEventListener(
        "click",
        function() {

            const code =
                codeInput.value
                    .trim()
                    .toUpperCase();


            if (!isValidRoomCode(code)) {

                return;

            }


            let savedChats =
                JSON.parse(
                    localStorage.getItem(
                        "messagrSavedChats"
                    ) || "[]"
                );


            const alreadySaved =
                savedChats.includes(code);


            /* ========================================
               DELETE CHAT
               ======================================== */

            if (alreadySaved) {

                savedChats =
                    savedChats.filter(
                        function(savedCode) {

                            return savedCode !== code;

                        }
                    );


                localStorage.setItem(
                    "messagrSavedChats",
                    JSON.stringify(savedChats)
                );


                loadSavedRooms();


                updateSaveChatButton();


                return;

            }


            /* ========================================
               SAVE CHAT
               ======================================== */

            savedChats.push(
                code
            );


            localStorage.setItem(
                "messagrSavedChats",
                JSON.stringify(savedChats)
            );


            loadSavedRooms();


            updateSaveChatButton();

        }
    );

}


/* ========================================
   LOAD SAVED ROOMS WHEN PAGE OPENS
   ======================================== */

loadSavedRooms();
