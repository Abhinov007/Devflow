import { notion } from "../config/notion.js";
import { notionClient } from "./client.js";

export async function listSprint({ pageSize = 20, filter, sorts } = {}) {
  const resp = await notionClient.databases.query({
    database_id: notion.sprintDbId,
    page_size: pageSize,
    ...(filter ? { filter } : {}),
    ...(sorts ? { sorts } : {}),
  });
  return resp.results;
}

export async function addToSprint({
  title,
  properties = {},
  children,
} = {}) {
  if (!title) throw new Error("addToSprint requires { title }");
  const resp = await notionClient.pages.create({
    parent: { database_id: notion.sprintDbId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      ...properties,
    },
    ...(children ? { children } : {}),
  });
  return resp;
}

