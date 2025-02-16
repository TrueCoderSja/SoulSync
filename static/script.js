const token = localStorage.getItem("sessionToken"); // Get this from login/signup API

const socket = io(window.location.origin, {
    auth: { token }, // Send token in handshake
    secure: true
});

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const connectBtn = document.getElementById("connectBtn");
const controls = document.getElementById("controls");

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

let localStream;
let isMuted = false;
let isVideoEnabled = true;

let peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Get user media (camera + mic)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("Media error:", error));

// Handle incoming tracks (Remote video)
peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

// Handle ICE candidate exchange
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
    }
};

// Handle connection state change
peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "closed") {
        handleDisconnect();
    }
};

function findMatch() {
    socket.emit("find-match");
    connectBtn.style.display = "none"; 
}

socket.on("match-found", data => {
    controls.classList.add("show");

    const partnerId = data.userid;
    const partnerName = data.name;

    // Update chat UI with partner details
    partnerInfo.innerHTML = `Chatting with: <b>${partnerName}</b> (ID: ${partnerId})`;

    // Update video overlay with partner details
    partnerOverlay.innerHTML = `Partner: <b>${partnerName}</b> (ID: ${partnerId})`;

    if (data.role === "donor") {
        peerConnection.createOffer()
            .then(offer => {
                peerConnection.setLocalDescription(offer);
                socket.emit("send-offer", offer);
            });
    }
});

// Handle incoming offer/answer
socket.on("receive-offer", (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit("send-answer", answer);
        });
});
socket.on("receive-answer", (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});
socket.on("receive-ice-candidate", (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Toggle Mute & Video
function toggleMute() {
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
}
function toggleVideo() {
    isVideoEnabled = !isVideoEnabled;
    localStream.getVideoTracks()[0].enabled = isVideoEnabled;
}

// Disconnect Call
function disconnectCall() {
    peerConnection.close();
    remoteVideo.srcObject = null;
    controls.classList.remove("show");
    connectBtn.style.display = "block";
    socket.emit("disconnect");
}

// Handle peer disconnect
socket.on("peer-disconnected", () => {
    disconnectCall();
});

// Chat Functionality
function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("send-message", message);
        addMessage("You", message);
        chatInput.value = "";
    }
}
socket.on("receive-message", (message) => {
    addMessage("Stranger", message);
});
function addMessage(sender, message) {
    const msg = document.createElement("div");
    msg.textContent = `${sender}: ${message}`;
    chatMessages.appendChild(msg);
}
