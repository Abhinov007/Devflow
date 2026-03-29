import { claudeMessagesCreate } from "../../utils/claudeClient.js";

function contentToText(content) {
  if (!Array.isArray(content)) return "";
  return content
    .map((c) => {
      if (!c) return "";
      if (typeof c === "string") return c;
      if (c.type === "text") return c.text || "";
      return "";
    })
    .join("");
}

export const claudeProvider = {
  id: "claude",
  async generateText({
    prompt,
    system,
    model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
    maxTokens = 1024,
    temperature = 0.2,
    signal,
  }) {
    const resp = await claudeMessagesCreate({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: prompt }],
      signal,
    });

    return {
      provider: "claude",
      model: resp.model || model,
      text: contentToText(resp.content),
      raw: resp,
    };
  },
};

