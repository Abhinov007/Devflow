import { notion } from "../config/notion.js";
import { notionClient } from "./client.js";

export async function listBacklog({ pageSize = 20, filter, sorts } = {}) {
  const resp = await notionClient.databases.query({
    database_id: notion.backlogDbId,
    page_size: pageSize,
    ...(filter ? { filter } : {}),
    ...(sorts ? { sorts } : {}),
  });
  return resp.results;
}

export async function addToBacklog({
  title,
  properties = {},
  children,
} = {}) {
  if (!title) throw new Error("addToBacklog requires { title }");
  const resp = await notionClient.pages.create({
    parent: { database_id: notion.backlogDbId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      ...properties,
    },
    ...(children ? { children } : {}),
  });
  return resp;
}

