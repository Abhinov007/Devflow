function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function extractNotionId(value) {
  if (!value) return null;
  // Accept raw 32-hex ids, dashed ids, or full URLs with query params (e.g. ?v=...).
  const str = String(value).trim();
  const match = str.match(/[0-9a-fA-F]{32}/);
  return match ? match[0].toLowerCase() : null;
}

export const notion = {
  apiKey: requireEnv("NOTION_API_KEY"),
  roadmapDbId: extractNotionId(requireEnv("NOTION_ROADMAP_DB")),
  backlogDbId: extractNotionId(requireEnv("NOTION_BACKLOG_DB")),
  sprintDbId: extractNotionId(requireEnv("NOTION_SPRINT_DB")),
  changelogPageId: extractNotionId(requireEnv("NOTION_CHANGELOG_PAGE")),
};

export { extractNotionId };
