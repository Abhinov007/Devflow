function stripCodeFences(text) {
  // ```json ... ``` or ``` ... ```
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return m ? m[1] : text;
}

function extractFirstJsonObject(text) {
  // Best-effort extraction of the first balanced {...} or [...] region.
  const s = text;
  const start = s.search(/[\{\[]/);
  if (start === -1) return null;

  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      if (inString) escape = true;
      continue;
    }
    if (c === '"') inString = !inString;
    if (inString) continue;

    if (c === open) depth++;
    if (c === close) depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

export function safeParseJSON(input, { fallback = null } = {}) {
  if (input == null) return fallback;
  if (typeof input === "object") return input;

  const raw = String(input).trim();
  if (!raw) return fallback;

  const candidates = [raw, stripCodeFences(raw)];
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {}
  }

  const extracted = extractFirstJsonObject(stripCodeFences(raw));
  if (!extracted) return fallback;
  try {
    return JSON.parse(extracted);
  } catch {
    return fallback;
  }
}

