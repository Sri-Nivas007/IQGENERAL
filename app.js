const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./connection/db");

const userRouter = require("./router/userRouter");

dotenv.config();

const app = express();
const port = process.env.PORT || 5800;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.use(userRouter);

// Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on("unhandledRejection", (reason, promise) => {
    // logger.error(Unhandled Rejection reason: ${reason});
    console.log(`Unhandled Rejection reason: ${reason}`);
    // Close the server
    // server.close(() => {
    //     logger.error("Server closed due to unhandled rejection.");
    //     process.exit(1);
    // });
});

process.on("uncaughtException", (err) => {
    // logger.error(uncaughtException:  ${err.name} - ${err.message});
    console.log(`uncaughtException:  ${err.name} - ${err.message}`);
    console.log(`reason:  ${err}`);
    // process.exit(1);
});
