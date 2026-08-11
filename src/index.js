import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`This app is listening on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error("App stopped because MongoDB connection failed!");
        process.exit(1);
    });
