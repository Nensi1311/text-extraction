// services/pdfExtractor.js
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function extractTransactionsFromText(text) {
  try {
    const prompt = `
You are a financial data extraction assistant.
Extract all financial transactions from the following text and return ONLY valid JSON.

The JSON should look like this:
{
  "transactions": [
    {
      "id": "unique-id-string",
      "userId": "user123",
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": 123.45,
      "type": "Credit" or "Debit",
      "category": "Food | Bills | Shopping | etc.",
      "balance": 5000.75
    }
  ]
}

Text:
"""${text}"""
`;

    const completion = await openai.chat.completions.create({
      model: "qwen/qwen3-235b-a22b-2507", // keep your model or change per your config
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = completion?.choices?.[0]?.message?.content?.trim();
    console.log("LLM Raw Output:\n", raw);

    // Extract the first JSON-looking chunk
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in LLM response");

    let jsonText = jsonMatch[0];
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (err) {
      // try to repair and parse
      try {
        const repaired = jsonrepair(jsonText);
        data = JSON.parse(repaired);
      } catch (err2) {
        console.error("JSON parse/repair failed:", err2);
        throw new Error("Failed to parse JSON from LLM output");
      }
    }

    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    // Do NOT save to any DB here — return parsed transactions back to caller.
    return { success: true, count: transactions.length, transactions };
  } catch (error) {
    console.error("extractTransactionsFromText Error:", error?.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
