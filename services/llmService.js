// services/llmService.js
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "FinancialPDFExtractor",
  },
});

export async function askLLM(messages, model = process.env.OPENROUTER_MODEL, options = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 1500,
      ...options,
    });

    const message = completion.choices?.[0]?.message?.content || "";
    return { success: true, message };
  } catch (err) {
    console.error("LLM call failed:", err);
    return { success: false, error: err.message };
  }
}

export async function askQuestion(question) {
  const messages = [{ role: "user", content: question }];
  return await askLLM(messages);
}