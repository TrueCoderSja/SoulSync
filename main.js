const express = require("express");
const http = require("http"); // Use HTTP instead of HTTPS
const cors = require("cors");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const setupSocket = require("./socketserver");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
    res.send("Hello Soul, Wanna get synced?");
});

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/app", express.static("static"));

const server = http.createServer(app); // Use HTTP server
const io = setupSocket(server); // Attach WebSocket server

const PORT = process.env.PORT || 3000; // Use Render's dynamic port
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
