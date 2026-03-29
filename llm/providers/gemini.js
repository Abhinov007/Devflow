function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const geminiProvider = {
  id: "gemini",
  async generateText({
    prompt,
    system,
    model = process.env.GEMINI_MODEL || "gemini-1.5-flash",
    maxTokens = 1024,
    temperature = 0.2,
    signal,
  }) {
    const apiKey = requireEnv("GEMINI_API_KEY");
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [
        ...(system
          ? [{ role: "user", parts: [{ text: `System:\n${system}` }] }]
          : []),
        { role: "user", parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.error?.status ||
        `Gemini API error (${res.status})`;
      throw new Error(msg);
    }

    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter(Boolean)
        .join("") ?? "";

    return { provider: "gemini", model, text, raw: json };
  },
};

