const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
var cors = require("cors");

const app = express();
app.use(express.json()); // to accept json data
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
dotenv.config();
connectDB();

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);
//redis
const redis = require("redis");

const client = redis.createClient();

const redisConnect = async () => {
  await client.connect();
};
redisConnect();

//socket
const io = require("socket.io")(server, {
  // pingTimeout: 60000,
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "UPDATE", "DELETE"],
  },
});
io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", async (userData) => {
    socket.join(userData._id);
    const result = await client.lRange("activeUsers", 0, -1);
    var array = result;
    if (!result.includes(userData._id)) {
      await client.lPush("activeUsers", userData._id);
      array = [...result, userData._id];
    }
    console.log(array, "setup");
    io.emit("connected", array);
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("leave", async (userData) => {
    socket.leave(userData._id);
    await client.lRem("activeUsers", 1, userData._id);
    const result = await client.lRange("activeUsers", 0, -1);
    console.log(result, "leave");
    io.emit("connected", result);
  });
});
