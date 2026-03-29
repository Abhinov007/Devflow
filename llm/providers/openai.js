function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const openaiProvider = {
  id: "openai",
  async generateText({
    prompt,
    system,
    model = process.env.OPENAI_MODEL || "gpt-4o-mini",
    maxTokens = 1024,
    temperature = 0.2,
    signal,
  }) {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const body = {
      model,
      temperature,
      max_output_tokens: maxTokens,
      input: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.error?.message || `OpenAI API error (${res.status})`;
      throw new Error(msg);
    }

    const text =
      json?.output_text ??
      json?.output?.[0]?.content?.map((c) => c?.text).filter(Boolean).join("") ??
      "";

    return { provider: "openai", model, text, raw: json };
  },
};

