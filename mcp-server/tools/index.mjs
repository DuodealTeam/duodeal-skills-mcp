import { connectionTools } from "./connection.mjs";
import { dealTools } from "./deals.mjs";
import { quotationTools } from "./quotations.mjs";
import { lineTools } from "./lines.mjs";
import { blockTools } from "./blocks.mjs";
import { customerTools } from "./customers.mjs";
import { catalogTools } from "./catalog.mjs";
import { mediaTools } from "./medias.mjs";
import { templateTools } from "./templates.mjs";
import { fieldTools } from "./fields.mjs";
import { userTools } from "./users.mjs";
import { webhookTools } from "./webhooks.mjs";
import { genericTools } from "./generic.mjs";

export const allTools = [
  ...connectionTools,
  ...dealTools,
  ...quotationTools,
  ...lineTools,
  ...blockTools,
  ...customerTools,
  ...catalogTools,
  ...mediaTools,
  ...templateTools,
  ...fieldTools,
  ...userTools,
  ...webhookTools,
  ...genericTools,
];

const seen = new Set();
for (const tool of allTools) {
  if (seen.has(tool.name)) throw new Error(`Duplicate tool name: ${tool.name}`);
  seen.add(tool.name);
}

export const toolByName = new Map(allTools.map((t) => [t.name, t]));
