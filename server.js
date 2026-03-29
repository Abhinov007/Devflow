#!/usr/bin/env node
import "dotenv/config";

import express from "express";
import cors from "cors";
import { logger } from "./utils/logger.js";
import { runNotionAgent } from "./llm/claudeToolUse.js";
import { runNotionAgentGemini } from "./llm/geminiToolUse.js";

function pickAgent(prompt) {
  if (process.env.ANTHROPIC_API_KEY) return runNotionAgent({ prompt });
  if (process.env.GEMINI_API_KEY) return runNotionAgentGemini({ prompt });
  throw new Error("No LLM API key found. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env");
}

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Main endpoint ─────────────────────────────────────────────────────────────
// POST /api/generate
// Body: { prompt: string }
//
// Sends the prompt to Claude, which uses Notion tools to:
//   1. Create a roadmap page
//   2. Populate the backlog with tasks
//   3. Add immediate tasks to the sprint
//
// Response: { success, summary, actions }
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body ?? {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  logger.info("POST /api/generate", { prompt: prompt.slice(0, 120) });

  try {
    const result = await pickAgent(prompt.trim());
    logger.success("Generate complete", { actions: result.actions.length });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error("Generate failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.success(`devflow server listening on http://localhost:${PORT}`);
});
