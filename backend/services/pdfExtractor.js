// services/pdfExtractor.js 
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    base_url: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Utility to safely convert a string (like "1,234.56CR") to a number
function safeParseFloat(value) {
    if (value === null || value === undefined) return null;
    
    // 1. Convert to string and remove non-numeric/decimal characters (and CR/DR suffixes)
    let cleaned = String(value).replace(/[^0-9.-]+/g, '');
    
    // 2. Safely parse as float
    const parsed = parseFloat(cleaned);
    
    // 3. Return parsed number or null if invalid (NaN)
    return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts all financial transactions from raw text output (likely generated from a PDF scan).
 * @param {string} text - The raw text content extracted from the bank statement PDF.
 * @returns {Promise<{success: boolean, count?: number, transactions?: Array, error?: string}>}
 */
export async function extractTransactionsFromText(text) {
    try {
        const prompt = `
You are a highly reliable **Financial Data Extraction Engine** processing unstructured, raw text that was generated from a bank statement (which may have been scanned, resulting in imperfect formatting).
Your **ONLY** output must be a single, complete, and valid JSON object adhering strictly to the provided SCHEMA.

### INSTRUCTIONS:
1. **Date Standardization:** Convert ALL date formats found in the text (e.g., DD-MM-YYYY, DD/MM/YY, DD-Month-YY) to the **STRICT ISO format: YYYY-MM-DD**.
2. **Amount and Type Logic:**
 * Amounts must be extracted as **numeric types** (e.g., \`123.45\`), **not strings**. Remove commas and currency symbols before converting to a float.
 * Determine **"type"** ("Credit" or "Debit") from the context, the position of the amount (Debit/Credit columns), or keywords (e.g., DEP, TFR, WDL, CASH WITHDRAWAL, FEES).
3. **Balance Extraction:** Extract the running **"balance"** as a **numeric type** (e.g., \`5000.75\`). If a balance isn't clearly and precisely available for a specific row, use \`null\`.

### SCHEMA:
{
 "transactions": [
 {
 "Date": "DD-MM-YYYY",
 "Description": "string (merge multi-line text into one clean string)",
 "Amount": 123.45, // Numeric float
 "Type": "Credit" or "Debit",
 "Balance": 5000.75 // Numeric float or null
 }
  ]
}

### DATA INPUT:
"""${text}"""
`;

        const completion = await openai.chat.completions.create({
            // Using a top-tier model for complex reasoning and adherence
            model: "qwen/qwen3-235b-a22b-2507", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" } 
        });

        const raw = completion?.choices?.[0]?.message?.content?.trim();
        console.log("LLM Raw Output:\n", raw.substring(0, 500) + '...');

        // 1. Use jsonrepair on the entire raw output for robust error correction
        // This handles incomplete JSON (truncation) and removes surrounding text/markdown fences.
        let data;
        try {
            const repaired = jsonrepair(raw);
            data = JSON.parse(repaired);
        } catch (err) {
            console.error("Critical: JSON repair/parse failed on raw output.", err);
            throw new Error("Failed to extract valid JSON structure from LLM output.");
        }

        // 2. Validate and clean transactions array
        const rawTransactions = Array.isArray(data?.transactions) ? data.transactions : [];

        const transactions = rawTransactions.map(txn => {
            return {
                date: txn.date,
                description: txn.description,
                
                // IMPORTANT: Ensure amount and balance are numeric
                amount: safeParseFloat(txn.amount),
                balance: safeParseFloat(txn.balance),
                
                type: txn.type
            };
        }).filter(txn => txn.amount !== null && ['Credit', 'Debit'].includes(txn.type));

        // 3. Final return
        return { success: true, count: transactions.length, transactions };
    } catch (error) {
        console.error("extractTransactionsFromText Error:", error?.message || error);
        return { success: false, error: error.message || String(error) };
    }
}