#!/usr/bin/env node
import "dotenv/config";

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { logger } from "./utils/logger.js";
import { runNotionAgent } from "./llm/claudeToolUse.js";
import { runNotionAgentGemini } from "./llm/geminiToolUse.js";
import { handleGithubWebhook } from "./github/webhook.js";

const JWT_SECRET = process.env.JWT_SECRET || "devflow-change-this-in-production";

// ── User store ────────────────────────────────────────────────────────────────
function getUsers() {
  try {
    return JSON.parse(readFileSync(new URL("./auth/users.json", import.meta.url)));
  } catch {
    return [];
  }
}

// ── JWT middleware ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : true,
  credentials: true,
}));

// Capture rawBody via express.json verify callback (doesn't consume the stream twice)
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); }
}));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Auth: login ────────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const payload = { id: user.id, name: user.name, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  logger.success("Login", { email: user.email });
  res.json({ token, user: payload });
});

// ── Auth: verify token ─────────────────────────────────────────────────────────
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ── Chat endpoint (SSE streaming, auth required) ───────────────────────────────
app.post("/api/chat", requireAuth, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (text) => res.write(`data: ${JSON.stringify({ content: text })}\n\n`);

  const { messages } = req.body ?? {};
  const prompt = [...(messages ?? [])].reverse().find((m) => m.role === "user")?.content?.trim();

  if (!prompt) {
    send("No message provided.");
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  logger.info("POST /api/chat", { user: req.user.email, prompt: prompt.slice(0, 120) });

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      await runNotionAgent({ prompt, onChunk: send });
    } else if (process.env.GEMINI_API_KEY) {
      await runNotionAgentGemini({ prompt, onChunk: send });
    } else {
      throw new Error("No LLM API key configured.");
    }
  } catch (err) {
    logger.error("Chat failed", { error: err.message });
    send(`\n\n**Error:** ${err.message}`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

// ── GitHub webhook ─────────────────────────────────────────────────────────────
// POST /api/github/webhook
// Receives PR events from GitHub and logs them to the Notion Changelog DB.
// No JWT auth — secured via HMAC signature (GITHUB_WEBHOOK_SECRET in .env).
app.post("/api/github/webhook", handleGithubWebhook);

// ── GitHub setup info ───────────────────────────────────────────────────────────
// GET /api/github/setup  — returns the webhook URL and instructions
app.get("/api/github/setup", requireAuth, (req, res) => {
  const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
  res.json({
    webhookUrl: `${base}/api/github/webhook`,
    secret: process.env.GITHUB_WEBHOOK_SECRET || "(not set)",
    instructions: [
      "Go to your GitHub repo → Settings → Webhooks → Add webhook",
      `Set Payload URL to: ${base}/api/github/webhook`,
      "Set Content type to: application/json",
      "Set Secret to the value of GITHUB_WEBHOOK_SECRET in your .env",
      "Under events, select: Let me select individual events → Pull requests",
      "Click Add webhook",
    ],
  });
});

// ── Generate endpoint (JSON, non-streaming) ────────────────────────────────────
app.post("/api/generate", requireAuth, async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  logger.info("POST /api/generate", { prompt: prompt.slice(0, 120) });

  try {
    const agent = process.env.ANTHROPIC_API_KEY ? runNotionAgent : runNotionAgentGemini;
    const result = await agent({ prompt: prompt.trim() });
    logger.success("Generate complete", { actions: result.actions.length });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error("Generate failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.success(`devflow server listening on http://localhost:${PORT}`);
});
