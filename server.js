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

// ✅ (Optional) Serve frontend files (e.g. index.html)
app.use(express.static("."));

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Simple Home Route
app.get("/", (req, res) => {
  res.send("✅ Text Extraction Server is running!");
});

// --- Extract text from uploaded PDF ---
app.post("/extract", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Call OpenAI to structure extracted text
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a financial data extractor. Extract structured transaction data as JSON.",
        },
        {
          role: "user",
          content: pdfData.text,
        },
      ],
    });

    const rawText = completion.choices[0].message.content;
    const repairedJSON = jsonrepair(rawText);
    const structuredData = JSON.parse(repairedJSON);

    res.json({ success: true, data: structuredData });
  } catch (error) {
    console.error("❌ Extraction error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));