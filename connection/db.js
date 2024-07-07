const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl:
        process.env.NODE_ENV === "production"
            ? {
                  require: true,
                  rejectUnauthorized: false,
              }
            : false,
});

// Function to execute SQL queries from file
async function executeSQLFromFile() {
    let client;
    try {
        client = await pool.connect();
        console.log("Connected to PostgreSQL");

        const sqlFilePath = path.join(__dirname, "../db.sql");
        const sqlQuery = fs.readFileSync(sqlFilePath, "utf-8");

        // Split the file into individual queries
        const queries = sqlQuery
            .split(";")
            .filter((query) => query.trim() !== "");

        for (let query of queries) {
            try {
                await client.query(query);
                console.log("Query executed successfully:", query.trim());
            } catch (error) {
                // Handle specific errors like table already exists
                if (error.code === "42P07") {
                    console.log(
                        `Table or relation already exists: ${query.trim()}`
                    );
                    continue;
                } else {
                    throw error;
                }
            }
        }

        console.log("All queries executed successfully");
    } catch (error) {
        console.error("Error executing SQL queries:", error);
    } finally {
        if (client) {
            await client.release(); // Release the client back to the pool
        }
    }
}

// Handle process termination to ensure pool is properly closed
process.on("SIGINT", async () => {
    console.log("Closing pool...");
    await pool.end();
    console.log("Pool closed");
    process.exit(0);
});
executeSQLFromFile();
module.exports = {
    pool,
    executeSQLFromFile,
};
