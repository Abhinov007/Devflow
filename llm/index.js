import { claudeProvider } from "./providers/claude.js";
import { openaiProvider } from "./providers/openai.js";
import { geminiProvider } from "./providers/gemini.js";

const providers = new Map([
  [claudeProvider.id, claudeProvider],
  [openaiProvider.id, openaiProvider],
  [geminiProvider.id, geminiProvider],
]);

export function getLLMProvider(id = process.env.LLM_PROVIDER || "claude") {
  const p = providers.get(id);
  if (!p) {
    throw new Error(
      `Unknown LLM provider "${id}". Available: ${Array.from(providers.keys()).join(", ")}`
    );
  }
  return p;
}

export { claudeProvider, openaiProvider, geminiProvider };

