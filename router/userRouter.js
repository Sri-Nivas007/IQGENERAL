const express = require("express");
const router = express.Router();

const { signUp, signin, updateData } = require("../controller/userController");
const { validateToken } = require("../middlewares/jwt");

// Signup route
router.post("/signup", signUp);

// Signin route
router.post("/signin", signin);

// update data
router.put("/user/data/:id?", validateToken, updateData);

module.exports = router;
