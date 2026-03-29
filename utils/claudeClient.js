import { logger } from "./logger.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export async function claudeMessagesCreate({
  model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
  max_tokens = 1024,
  temperature = 0.2,
  system,
  messages,
  signal,
} = {}) {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Claude request must include non-empty messages[]");
  }

  const body = {
    model,
    max_tokens,
    temperature,
    messages,
    ...(system ? { system } : {}),
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error("Claude API error", { status: res.status, body: text });
    throw new Error(`Claude API error (${res.status})`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Claude API returned non-JSON response");
  }
  return json;
}

