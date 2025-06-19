import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";

const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(`Welcome to DESI-LEETCODE`);
});

app.use("/api/v1/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
