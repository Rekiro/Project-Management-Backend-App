import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use -> is middleware

// basic configurations
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// cors configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true, //enables sharing of cookies
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

// import the routes

import healthCheckRouter from "./routes/healthCheck.route.js";
import authRouter from "./routes/auth.route.js";

app.use("/api/v1/healthcheck/", healthCheckRouter);
app.use("/api/v1/auth/", authRouter);

app.get("/", (req, resp) => {
    resp.send("Hello world!");
});

app.use((err, req, resp, next) => {
    const statusCode = err.statusCode || 500;
    return resp.status(statusCode).json({
        statusCode: statusCode,
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

export default app;
