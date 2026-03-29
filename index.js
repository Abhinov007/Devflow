#!/usr/bin/env node
import "dotenv/config";

import { Command } from "commander";
import { logger } from "./utils/logger.js";
import { safeParseJSON } from "./utils/parseJSON.js";
import { getLLMProvider } from "./llm/index.js";
import { listRoadmap } from "./mcp/roadmap.js";
import { listBacklog, addToBacklog } from "./mcp/backlog.js";
import { listSprint, addToSprint } from "./mcp/sprint.js";
import { appendChangelog } from "./mcp/changelog.js";

const program = new Command();

program
  .name("devflow")
  .description("CLI for Notion task flow + LLM helpers")
  .version("1.0.0");

program
  .command("roadmap:list")
  .option("--limit <n>", "max results", "20")
  .action(async (opts) => {
    const items = await listRoadmap({ pageSize: Number(opts.limit) || 20 });
    logger.info(`Roadmap items: ${items.length}`);
    for (const p of items) {
      const title =
        p?.properties?.Name?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.properties?.Title?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.id;
      console.log(`- ${title}`);
    }
  });

program
  .command("backlog:list")
  .option("--limit <n>", "max results", "20")
  .action(async (opts) => {
    const items = await listBacklog({ pageSize: Number(opts.limit) || 20 });
    logger.info(`Backlog items: ${items.length}`);
    for (const p of items) {
      const title =
        p?.properties?.Name?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.properties?.Title?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.id;
      console.log(`- ${title}`);
    }
  });

program
  .command("backlog:add")
  .requiredOption("-t, --title <text>", "page title")
  .action(async (opts) => {
    const p = await addToBacklog({ title: opts.title });
    logger.success("Added to backlog", { id: p.id, url: p.url });
  });

program
  .command("sprint:list")
  .option("--limit <n>", "max results", "20")
  .action(async (opts) => {
    const items = await listSprint({ pageSize: Number(opts.limit) || 20 });
    logger.info(`Sprint items: ${items.length}`);
    for (const p of items) {
      const title =
        p?.properties?.Name?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.properties?.Title?.title?.map((t) => t?.plain_text).filter(Boolean).join("") ||
        p?.id;
      console.log(`- ${title}`);
    }
  });

program
  .command("sprint:add")
  .requiredOption("-t, --title <text>", "page title")
  .action(async (opts) => {
    const p = await addToSprint({ title: opts.title });
    logger.success("Added to sprint", { id: p.id, url: p.url });
  });

program
  .command("changelog:append")
  .requiredOption("-l, --line <text...>", "one or more lines (repeatable)", (v, p) =>
    p ? p.concat([v]) : [v]
  )
  .option("--heading <text>", "heading text", "Changelog")
  .option("--date <yyyy-mm-dd>", "date override")
  .action(async (opts) => {
    const lines = Array.isArray(opts.line) ? opts.line.flat() : [opts.line];
    const resp = await appendChangelog({
      heading: opts.heading,
      lines,
      date: opts.date || new Date(),
    });
    logger.success("Changelog appended", { results: resp?.results?.length ?? 0 });
  });

program
  .command("llm:ask")
  .requiredOption("-p, --provider <id>", "claude|openai|gemini")
  .requiredOption("--prompt <text>", "prompt text")
  .option("--system <text>", "system instruction")
  .option("--json", "attempt to parse JSON from the model response")
  .action(async (opts) => {
    const llm = getLLMProvider(opts.provider);
    const out = await llm.generateText({ prompt: opts.prompt, system: opts.system });
    logger.success("LLM response", { provider: out.provider, model: out.model });
    console.log(out.text);
    if (opts.json) {
      const parsed = safeParseJSON(out.text, { fallback: null });
      logger.info("Parsed JSON", parsed);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  logger.error(err?.message || "Command failed", { stack: err?.stack });
  process.exitCode = 1;
});

