import { notion } from "../config/notion.js";
import { notionClient } from "./client.js";

export async function listInbox({ pageSize = 20, filter, sorts } = {}) {
  const resp = await notionClient.databases.query({
    database_id: notion.inboxDbId,
    page_size: pageSize,
    ...(filter ? { filter } : {}),
    ...(sorts ? { sorts } : {}),
  });
  return resp.results;
}

export async function addToInbox({
  title,
  properties = {},
  children,
} = {}) {
  if (!title) throw new Error("addToInbox requires { title }");
  const resp = await notionClient.pages.create({
    parent: { database_id: notion.inboxDbId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      ...properties,
    },
    ...(children ? { children } : {}),
  });
  return resp;
}

