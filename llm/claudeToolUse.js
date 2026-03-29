import { logger } from "../utils/logger.js";
import { TOOL_DEFINITIONS, executeTool } from "../tools/notionTools.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function callClaude({ model, max_tokens, system, messages, tools }) {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens, system, messages, tools }),
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error("Claude API error", { status: res.status, body: text });
    throw new Error(`Claude API error (${res.status}): ${text}`);
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

export async function runNotionAgent({
  prompt,
  model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
}) {
  const messages = [{ role: "user", content: prompt }];
  const actions = [];
  const MAX_ITERATIONS = 15;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const resp = await callClaude({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools: TOOL_DEFINITIONS,
    });

    logger.info("Claude turn", { stop_reason: resp.stop_reason, blocks: resp.content?.length });

    // Append assistant turn to conversation history
    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason === "end_turn") {
      const summary = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { summary, actions };
    }

    if (resp.stop_reason === "tool_use") {
      const toolUseBlocks = resp.content.filter((b) => b.type === "tool_use");
      const toolResults = [];

      for (const block of toolUseBlocks) {
        logger.info(`Tool call: ${block.name}`, block.input);
        try {
          const result = await executeTool(block.name, block.input);
          actions.push({ tool: block.name, input: block.input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          logger.error(`Tool error: ${block.name}`, { error: err.message });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: true,
            content: err.message,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason — bail out
    logger.warn("Unexpected stop_reason", { stop_reason: resp.stop_reason });
    break;
  }

  return { summary: "Agent finished.", actions };
}
