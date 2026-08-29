self.addEventListener(
    "push",
    function(event) {

        let data = {
            username: "Someone",
            text: "You received a new message."
        };


        try {

            if (event.data) {

                data =
                    event.data.json();

            }

        } catch (error) {

            console.log(
                "Could not read push data."
            );

        }


        const title =
            data.username +
            " sent a message";


        const options = {

            body:
                data.text,

            icon:
                "/images/icon.png",

            badge:
                "/images/icon.png",

            tag:
                "chat-message",

            renotify:
                true

        };


        event.waitUntil(

            self.registration.showNotification(
                title,
                options
            )

        );

    }
);


/* ========================================
   NOTIFICATION CLICK
   ======================================== */

self.addEventListener(
    "notificationclick",
    function(event) {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then(
                function(clientList) {

                    for (
                        const client of clientList
                    ) {

                        if (
                            "focus" in client
                        ) {

                            return client.focus();

                        }

                    }


                    if (
                        clients.openWindow
                    ) {

                        return clients.openWindow(
                            "/"
                        );

                    }

                }
            )

        );

    }
);
