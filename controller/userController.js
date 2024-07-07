const { pool } = require("../connection/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
    isValidUsername,
    isValidPhoneNumber,
    isValidPassword,
} = require("../functions/commonFunctions");
const { generateToken } = require("../middlewares/jwt");

async function signUp(req, res) {
    const { username, phone_number, password } = req.body;
    console.log("req.body", req.body);
    let client;

    try {
        if (!isValidUsername(username)) {
            return res.status(400).json({
                status: "failed",
                msg: "Invalid username format",
            });
        }

        if (!isValidPhoneNumber(phone_number)) {
            return res.status(400).json({
                status: "failed",
                msg: "Invalid phone number format",
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                status: "failed",
                msg: "Invalid password format",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if phoneNumber already exists
        client = await pool.connect();
        const checkPhoneNumberQuery = `
            SELECT EXISTS (
                SELECT 1 FROM users WHERE phone_number = $1
            )
        `;
        const checkPhoneNumberValues = [phone_number];
        const phoneNumberExistsResult = await client.query(
            checkPhoneNumberQuery,
            checkPhoneNumberValues
        );
        console.log("phoneNumberExistsResult", phoneNumberExistsResult);
        const phoneNumberExists = phoneNumberExistsResult.rows[0].exists;

        if (phoneNumberExists) {
            return res.status(400).json({
                status: "failed",
                msg: "Phone number already exists",
            });
        }

        const createUserQuery = `
            SELECT create_user($1, $2, $3) AS new_user_id
        `;
        const createUserValues = [username, phone_number, hashedPassword];
        const result = await client.query(createUserQuery, createUserValues);

        // Extract the new user ID from the query result
        const newUserId = result.rows[0].new_user_id;

        // Respond with success message
        res.status(201).json({
            status: "success",
            msg: "User successfully registered",
            data: {
                userId: newUserId,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        // Respond with error message
        res.status(500).json({
            status: "failed",
            error: "Internal server error",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Example validation functions (replace with your actual validation logic)
// function isValidUsername(username) {
//     // Implement your validation logic for username here
//     return username && username.length >= 3;
// }

// function isValidPhoneNumber(phoneNumber) {
//     console.log("phoneNumber", phoneNumber);
//     // Implement your validation logic for phoneNumber here
//     return phoneNumber && /^\d{10}$/.test(phoneNumber); // Example: 10-digit phone number validation
// }

// function isValidPassword(password) {
//     // Implement your validation logic for password here
//     return password && password.length >= 6;
// }

async function signin(req, res) {
    const { phone_number, password } = req.body;
    console.log("req.body", req.body);

    let client;
    try {
        client = await pool.connect();

        // Check if phone_number exists
        const checkPhoneNumberQuery = `
            SELECT EXISTS (
                SELECT 1 FROM users WHERE phone_number = $1
            )
        `;
        const checkPhoneNumberValues = [phone_number];
        const phoneNumberExistsResult = await client.query(
            checkPhoneNumberQuery,
            checkPhoneNumberValues
        );
        const phoneNumberExists = phoneNumberExistsResult.rows[0].exists;
        console.log("phoneNumberExists", phoneNumberExists);

        if (!phoneNumberExists) {
            return res.status(401).json({
                status: "failed",
                msg: "Phone number does not exist",
            });
        }
        const getPasswordQuery = `
        SELECT password FROM users WHERE phone_number = $1
    `;
        const getPasswordValues = [phone_number];
        const getPasswordResult = await client.query(
            getPasswordQuery,
            getPasswordValues
        );
        const hashedPassword = getPasswordResult.rows[0].password;

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        // Validate username and password using validate_user function
        const validateUserQuery = `
            SELECT * FROM public.validate_user($1, $2,$3)
        `;
        const validateUserValues = [phone_number, password, passwordMatch];
        const result = await client.query(
            validateUserQuery,
            validateUserValues
        );
        console.log("resultssss", result);

        if (result.rows.length === 0) {
            return res.status(401).json({
                status: "failed",
                msg: "Invalid username or password",
            });
        }

        const { user_id, is_valid, mislogin, nextlogin } = result.rows[0];
        console.log("result.rows[0]", result.rows[0]);
        console.log("mislogin", mislogin);

        if (!is_valid) {
            // Incorrect password handling based on mislogin count
            if (mislogin >= 7) {
                return res.status(401).json({
                    status: "failed",
                    msg: "Account blocked. Too many login attempts.",
                });
            }

            let msg;
            if (mislogin < 3) {
                msg = `Invalid password attempt ${mislogin}`;
            } else if (nextlogin) {
                const minutes = Math.ceil(
                    (nextlogin - Date.now()) / (1000 * 60)
                );
                msg = `Invalid password attempt,please try again after ${minutes} minutes.`;
            }

            return res.status(401).json({
                status: "failed",
                msg: msg,
                //  next_login_time: nextlogin,
            });
        }

        const token = await generateToken(user_id);
        console.log("tokendsdsdsdsd", token);
        const updateTokenQuery = `
        SELECT update_user_token($1, $2)

    `;
        const updateTokenValues = [user_id, token];
        await client.query(updateTokenQuery, updateTokenValues);
        res.status(200).json({
            status: "success",
            msg: "User logged in successfully",
            // token: token,
        });
    } catch (error) {
        console.error("Error signing in:", error);
        res.status(500).json({
            status: "failed",
            error: "Internal server error",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
}
//const SECRET_KEY = "IQGENERAL";
//const TOKEN_EXPIRATION = "3h"; // Token expiration time, e.g., 1 hour
// function generateToken(user_id) {
//     const payload = { user_id };
//     const options = { expiresIn: TOKEN_EXPIRATION };
//     return jwt.sign(payload, SECRET_KEY, options);
// }

const updateData = async (req, res) => {
    const activity_id = req.params.id;
    const { auth_key, profile_id, account_id, userId } = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Call PostgreSQL function to update data
        const result = await client.query(
            "SELECT update_data($1, $2, $3, $4, $5)",
            [activity_id, auth_key, profile_id, account_id, userId]
        );

        await client.query("COMMIT");
        const response = {
            status: "success",
            msg: "updated successfully",
        };
        res.status(200).json(response);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating data:", error);
        const response = {
            status: "error",
            message: error.message || "Error updating data", // Provide a fallback message
        };
        res.status(500).json(response);
    } finally {
        client.release();
    }
};

module.exports = {
    signUp,
    signin,
    updateData,
};
