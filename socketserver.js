const jwt = require("jsonwebtoken");
const jToken = require("./config/jwt.json").JWT_SECRET;

module.exports = (server) => {
    const io = require("socket.io")(server, {
        cors: { origin: "*" }
    });

    const waitingUsers = [];

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token; // Retrieve token from handshake
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(token, jToken);
            socket.userid = decoded.userid; // Attach user data to the socket
            socket.name = decoded.name;
            console.log(decoded);
            next(); // Proceed with the connection
        } catch (err) {
            console.log(err);
            socket.emit("sft_data", { err: "invalid-token" });
            socket.disconnect();
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("find-match", () => {
            console.log("Find match");

            if (waitingUsers.length > 0) {
                const partnerId = waitingUsers.pop();
                const partnerSocket = io.sockets.sockets.get(partnerId);

                if (partnerSocket) {
                    // Assign roles explicitly
                    socket.peer = partnerSocket;
                    socket.role = "donor";
                    partnerSocket.peer = socket;
                    partnerSocket.role = "receiver";
                    io.to(socket.id).emit("match-found", { partnerId: partnerId, userid: partnerSocket.userid, name: partnerSocket.name, role: "donor" });
                    io.to(partnerId).emit("match-found", { partnerId: socket.id, userid: socket.userid, name: socket.name, role: "receiver" });
                } else {
                    // Partner disconnected, re-add the current user to the waiting list
                    waitingUsers.push(socket.id);
                }
            } else {
                // No partner available, add the current user to the waiting list
                waitingUsers.push(socket.id);
            }
        });


        // Handle offer
        socket.on("send-offer", (offer) => {
            io.to(socket.peer.id).emit("receive-offer", offer);
        });

        // Handle answer
        socket.on("send-answer", (answer) => {
            io.to(socket.peer.id).emit("receive-answer", answer);
        });

        // Handle ICE candidates
        socket.on("ice-candidate", (candidate) => {
            io.to(socket.peer.id).emit("receive-ice-candidate", candidate);
        });

        // socket.on("disconnect", () => {
        //     console.log("User disconnected:", socket.id);
        //     io.to(socket.partnerSocket.id).emit("peer-disconnected");
        // });

        // Handle chat messages
        socket.on("send-message", (message) => {
            if (socket.peer) {
                io.to(socket.peer.id).emit("receive-message", message);
            }
        });

        // Disconnect Call
        function disconnectCall() {
            peerConnection.close();
            remoteVideo.srcObject = null;
            controls.classList.remove("show"); // Hide controls after disconnect
            connectBtn.style.display = "block"; // Show connect button again
            socket.emit("disconnect"); // Notify the other user
        }

        // Handle disconnect
        function handleDisconnect() {
            remoteVideo.srcObject = null; // Clear the remote video
            controls.classList.remove("show"); // Hide controls
            connectBtn.style.display = "block"; // Show connect button
            peerConnection.restartIce(); // Restart ICE (optional, depending on your use case)
        }

        // Listen for peer disconnect
        socket.on("peer-disconnected", () => {
            handleDisconnect();
        });
    });

    return io;
};