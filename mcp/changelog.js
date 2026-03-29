import { notion } from "../config/notion.js";
import { notionClient } from "./client.js";

function richText(text) {
  return [{ type: "text", text: { content: text } }];
}

export async function appendChangelog({
  heading = "Changelog",
  lines = [],
  date = new Date(),
} = {}) {
  const dateStr = typeof date === "string" ? date : date.toISOString().slice(0, 10);
  const blocks = [
    { type: "heading_3", heading_3: { rich_text: richText(`${heading} — ${dateStr}`) } },
    ...lines.map((t) => ({
      type: "bulleted_list_item",
      bulleted_list_item: { rich_text: richText(String(t)) },
    })),
  ];

  const resp = await notionClient.blocks.children.append({
    block_id: notion.changelogPageId,
    children: blocks,
  });
  return resp;
}

