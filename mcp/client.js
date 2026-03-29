import { Client } from "@notionhq/client";
import { notion } from "../config/notion.js";

export function createNotionClient({ auth = notion.apiKey } = {}) {
  return new Client({ auth });
}

export const notionClient = createNotionClient();

