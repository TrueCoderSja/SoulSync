const express = require("express");
const https = require("https"); // Change from http to https
const fs = require("fs");
const cors = require("cors");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const setupSocket = require("./socketserver");

const app = express();

// Load SSL certificate and key
const options = {
    key: fs.readFileSync("server.key"), // Private key
    cert: fs.readFileSync("server.cert") // Certificate
};

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
    res.send("Hello Soul, Wanna get synced?");
});

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/app", express.static("static"));

const server = https.createServer(options, app); // Create HTTPS server
const io = setupSocket(server); // Attach WebSocket server

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 HTTPS Server running on https://localhost:${PORT}`);
});
