import { notionClient } from "./client.js";
import { notion } from "../config/notion.js";

function richText(text) {
  return [{ type: "text", text: { content: text } }];
}

export async function listRoadmap({ pageSize = 20, filter, sorts } = {}) {
  const resp = await notionClient.databases.query({
    database_id: notion.roadmapDbId,
    page_size: pageSize,
    ...(filter ? { filter } : {}),
    ...(sorts ? { sorts } : {}),
  });
  return resp.results;
}

export async function addToRoadmap({ title, phases = [] }) {
  const children = [];

  for (const phase of phases) {
    children.push({
      type: "heading_2",
      heading_2: { rich_text: richText(phase.name) },
    });

    if (phase.description) {
      children.push({
        type: "paragraph",
        paragraph: { rich_text: richText(phase.description) },
      });
    }

    for (const task of phase.tasks || []) {
      children.push({
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: richText(task) },
      });
    }
  }

  const resp = await notionClient.pages.create({
    parent: { database_id: notion.roadmapDbId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
    },
    children,
  });

  return resp;
}
