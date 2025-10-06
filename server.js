// server.js
import express from "express";
import dotenv from "dotenv";
import uploadRoutes from "./api/routes/uploadRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// serve the downloads folder so CSVs are directly downloadable
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// register routes (POST /upload)
app.use("/", uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
