// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const { jsonrepair } = require("jsonrepair");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files (index.html, etc.)
app.use(express.static("."));

const upload = multer({ dest: "uploads/" });

// OpenRouter setup
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "",
    "X-Title": process.env.SITE_NAME || "",
  },
});

// Simple Home Route
app.get("/", (req, res) => {
  res.send("Text Extraction Server is running with OpenRouter!");
});

// Extract text from uploaded PDF
app.post("/extract", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Call OpenRouter to structure extracted text
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen3-235b-a22b-2507",
      messages: [
        {
          role: "system",
          content: `You are a financial data extractor. ONLY return JSON array of transactions. 
Do not include any extra text.`,
        },
        {
          role: "user",
          content: pdfData.text,
        },
      ],
    });

    const rawText = completion.choices[0].message.content;

    // Repair JSON in case it's malformed
    const repairedJSON = jsonrepair(rawText);
    const structuredData = JSON.parse(repairedJSON);

    // Print extracted data to console
    console.log("Extracted Data:", structuredData);

    // Send JSON response for frontend
    res.json({
      success: true,
      count: structuredData.length,
      transactions: structuredData,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));