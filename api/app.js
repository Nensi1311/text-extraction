// api/app.js
import express from "express";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();
app.use(express.json());
app.use("/api", uploadRoutes);

export default app;