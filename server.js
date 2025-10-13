// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const { jsonrepair } = require("jsonrepair");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads directory for CSV downloads
app.use("/uploads", express.static("uploads"));

// Serve frontend build files
app.use(express.static("frontend/build"));

const upload = multer({ dest: "uploads/" });

// OpenRouter setup
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

// Serve React app for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

// Extract text from uploaded PDF
app.post("/api/upload", upload.single("file"), async (req, res) => {
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
          content: `You are a highly reliable Financial Data Extraction Engine processing unstructured, raw text from a bank statement.
Your ONLY output must be a single, complete, and valid JSON object adhering strictly to the provided SCHEMA.

### INSTRUCTIONS:
1. **Date Standardization:** Convert ALL date formats found in the text (e.g., DD-MM-YYYY, DD/MM/YY, DD-Month-YY) to the STRICT ISO format: YYYY-MM-DD.
2. **Amount and Type Logic:**
   * Amounts must be extracted as numeric types (e.g., 123.45), not strings. Remove commas and currency symbols before converting to a float.
   * Determine "type" ("Credit" or "Debit") from the context, the position of the amount (Debit/Credit columns), or keywords (e.g., DEP, TFR, WDL, CASH WITHDRAWAL, FEES, NEFT, RTGS, CHQ).
3. **Balance Extraction:** Extract the running "balance" as a numeric type (e.g., 5000.75). If a balance isn't clearly and precisely available for a specific row, use null.

### SCHEMA:
{
 "transactions": [
 {
 "date": "YYYY-MM-DD",
 "description": "string (merge multi-line text into one clean string)",
 "amount": 123.45,
 "type": "Credit" or "Debit",
 "balance": 5000.75
 }
 ]
}

Return ONLY the JSON object, no additional text.`,
        },
        {
          role: "user",
          content: pdfData.text,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawText = completion.choices[0].message.content;

    // Repair JSON in case it's malformed
    const repairedJSON = jsonrepair(rawText);
    const data = JSON.parse(repairedJSON);

    // Extract transactions array from the response
    const structuredData = Array.isArray(data?.transactions) ? data.transactions : [];

    // Print extracted data to console
    console.log("Extracted Data:", structuredData);

    // Generate CSV content with proper headers
    const headers = ["Date", "Description", "Amount", "Type", "Balance"];
    const csvContent = [
      headers.join(","), // headers
      ...structuredData.map(tx => [
        tx.date || "",
        `"${(tx.description || "").replace(/"/g, '""')}"`, // escape quotes in description
        tx.amount || "",
        tx.type || "",
        tx.balance || ""
      ].join(","))
    ].join("\n");

    // Create CSV file
    const csvFileName = `transactions_${Date.now()}.csv`;
    const csvPath = `uploads/${csvFileName}`;
    fs.writeFileSync(csvPath, csvContent);

    // Send JSON response for frontend
    res.json({
      success: true,
      count: structuredData.length,
      transactions: structuredData,
      csvUrl: `/uploads/${csvFileName}`
    });
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Catch-all handler for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));