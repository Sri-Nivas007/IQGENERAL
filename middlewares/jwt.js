const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET || "IQGENERAL";

const generateToken = async (user_id) => {
    const token = await jwt.sign({ user_id }, secretKey, { expiresIn: "1h" }); // Token expires in 1 hour
    console.log("token", token);
    return token;
};

const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log("authHeader", authHeader);
    const token = authHeader;

    if (!token) {
        console.log("token", token);
        return res.status(400).send("unauthorized");
    }
    jwt.verify(token, secretKey, (err, user) => {
        console.log("err", err);
        if (err) {
            return res.status(403).send("Not valid token");
        }
        req.body.userId = user.user_id;
        next();
    });
};

module.exports = { generateToken, validateToken };
