import { logger } from "../utils/logger.js";
import { TOOL_DEFINITIONS, executeTool } from "../tools/notionTools.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// Convert Claude-style tool definitions to Gemini functionDeclarations
function toGeminiFunctions(tools) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));
}

async function callGemini({ model, systemInstruction, contents, apiKey }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    tools: [{ function_declarations: toGeminiFunctions(TOOL_DEFINITIONS) }],
    tool_config: { function_calling_config: { mode: "AUTO" } },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error("Gemini API error", { status: res.status, body: text });
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

const SYSTEM_PROMPT = `You are a project planning assistant that helps developers organise their work in Notion.

The workspace has three databases with distinct purposes:
- Roadmap DB: high-level project roadmaps broken into phases. One entry per project.
- Backlog DB: individual tasks that need to be done but are not immediate — carry-over work, planned features, future fixes.
- Sprint DB: the immediate tasks to work on right now (3–5 max).

When a user describes a project they want to build:
1. Call create_roadmap first with a clear phased breakdown (Setup, Core Features, Testing, Launch are good defaults — adapt to the project).
2. Add every concrete development task to the backlog using add_task_to_backlog.
3. Add only the 3–5 most immediate tasks to the sprint using add_task_to_sprint.

Rules:
- Be specific and actionable. "Set up Express server with /health route" beats "Set up backend".
- Backlog and roadmap tasks should match — don't invent extra tasks.
- After all tool calls finish, write a short plain-English summary of what was created.`;

export async function runNotionAgentGemini({
  prompt,
  model = process.env.GEMINI_MODEL || "gemini-2.0-flash",
  onChunk = null,
}) {
  const send = (text) => onChunk?.(text);
  const apiKey = requireEnv("GEMINI_API_KEY");
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const actions = [];
  let roadmapUrl = null;
  const MAX_ITERATIONS = 15;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const resp = await callGemini({ model, systemInstruction: SYSTEM_PROMPT, contents, apiKey });

    const candidate = resp.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const finishReason = candidate?.finishReason;

    logger.info("Gemini turn", { finishReason, parts: parts.length });

    contents.push({ role: "model", parts });

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      const summary = parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("");
      send(summary);
      if (roadmapUrl) send(`\n\n---\n[📋 View in Notion](${roadmapUrl})`);
      return { summary, actions };
    }

    const functionResponses = [];
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      logger.info(`Tool call: ${name}`, args);

      const label = {
        create_roadmap: `Creating roadmap: **${args.title}**...`,
        add_task_to_backlog: `Adding to backlog: ${args.title}`,
        add_task_to_sprint: `Adding to sprint: ${args.title}`,
      }[name] ?? `Calling ${name}...`;
      send(`\n${label}`);

      try {
        const result = await executeTool(name, args);
        actions.push({ tool: name, input: args, result });
        if (name === "create_roadmap" && result.url) roadmapUrl = result.url;
        functionResponses.push({
          functionResponse: { name, response: { output: JSON.stringify(result) } },
        });
      } catch (err) {
        logger.error(`Tool error: ${name}`, { error: err.message });
        send(` ❌ ${err.message}`);
        functionResponses.push({
          functionResponse: { name, response: { error: err.message } },
        });
      }
    }

    contents.push({ role: "user", parts: functionResponses });
  }

  const summary = "Agent finished.";
  if (roadmapUrl) send(`\n\n---\n[📋 View in Notion](${roadmapUrl})`);
  return { summary, actions };
}
