const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware backed by MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

io.on("connection", (socket) => {
  socket.on("join-room", ({ role, userId }) => {
    if (role && userId) {
      socket.join(`${role}:${userId}`);
    }
  });

  // ── Live location tracking ──
  // Mechanic/delivery driver sends GPS coordinates periodically.
  // Relayed to the user so they see the provider moving on the map.
  socket.on("location:update", ({ requestId, userId, coords }) => {
    if (requestId && userId && coords) {
      io.to(`user:${userId}`).emit("location:tracking", {
        requestId,
        coords, // { lat, lng }
        timestamp: Date.now(),
      });
    }
  });

  // User shares their location so the mechanic can navigate to them.
  socket.on("location:share-user", ({ requestId, mechanicId, coords }) => {
    if (requestId && mechanicId && coords) {
      io.to(`mechanic:${mechanicId}`).emit("location:user-update", {
        requestId,
        coords, // { lat, lng }
        timestamp: Date.now(),
      });
    }
  });

  socket.on("disconnect", () => {
    // Keep empty for now; useful if connection audits are required later.
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "OnRoad API is running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/mechanics", require("./routes/mechanic"));
app.use("/api/fuel-stations", require("./routes/fuelStation"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/feedback", require("./routes/feedback"));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
