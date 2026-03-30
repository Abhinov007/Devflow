function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Missing required env var: ${name}`);
    return '';
  }
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
  roadmapDbId: extractNotionId(requireEnv("NOTION_ROADMAP_PAGE")),
  sprintDbId: extractNotionId(requireEnv("NOTION_SPRINT_DB")),
  backlogDbId: extractNotionId(requireEnv("NOTION_BACKLOG_DB")),
  changelogDbId: extractNotionId(requireEnv("NOTION_CHANGELOG_DB")),
};

export { extractNotionId };
