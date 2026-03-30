import { notionClient } from "./client.js";
import { notion } from "../config/notion.js";

export async function addChangelogEntry({
  title,
  status,   // 'Opened' | 'Merged' | 'Closed'
  author,
  repo,
  prUrl,
  date = new Date(),
}) {
  const dateStr = typeof date === "string" ? date : date.toISOString().slice(0, 10);

  const resp = await notionClient.pages.create({
    parent: { database_id: notion.changelogDbId },
    properties: {
      Name:   { title: [{ text: { content: title } }] },
      Status: { select: { name: status } },
      Author: { rich_text: [{ text: { content: author } }] },
      Repo:   { rich_text: [{ text: { content: repo } }] },
      PR_URL: { url: prUrl },
      Date:   { date: { start: dateStr } },
    },
  });

  return resp;
}
