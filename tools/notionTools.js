import { addToBacklog } from "../mcp/backlog.js";
import { addToSprint } from "../mcp/sprint.js";
import { addToRoadmap } from "../mcp/roadmap.js";

export const TOOL_DEFINITIONS = [
  {
    name: "create_roadmap",
    description:
      "Create a structured roadmap entry in the Notion Roadmap database with phases and tasks. Always call this first.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the roadmap entry" },
        phases: {
          type: "array",
          description: "Ordered phases of the project",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Phase name, e.g. 'Phase 1: Setup'" },
              description: { type: "string", description: "Short summary of the phase" },
              tasks: {
                type: "array",
                items: { type: "string" },
                description: "List of tasks in this phase",
              },
            },
            required: ["name", "tasks"],
          },
        },
      },
      required: ["title", "phases"],
    },
  },
  {
    name: "add_task_to_backlog",
    description:
      "Add a task to the Notion Backlog database. Use for tasks that were not completed and need to be carried over, or planned work that isn't immediate.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
      },
      required: ["title"],
    },
  },
  {
    name: "add_task_to_sprint",
    description:
      "Add an immediate task to the current sprint in Notion. Use only for the highest-priority tasks to be done right now (3–5 max).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
      },
      required: ["title"],
    },
  },
];

export async function executeTool(name, input) {
  switch (name) {
    case "create_roadmap": {
      const page = await addToRoadmap(input);
      return { success: true, pageId: page.id, url: page.url };
    }
    case "add_task_to_backlog": {
      const page = await addToBacklog({ title: input.title });
      return { success: true, pageId: page.id, url: page.url, title: input.title };
    }
    case "add_task_to_sprint": {
      const page = await addToSprint({ title: input.title });
      return { success: true, pageId: page.id, url: page.url, title: input.title };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
