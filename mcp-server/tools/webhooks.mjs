// Webhooks — NOT in openapi.yaml (spec predates the feature). Existence of
// GET /webhooks verified live on 2026-07-23 (200, {data, meta}). Payload shape
// for POST/PUT is inferred from REST conventions and the official Duodeal MCP
// (create_webhook/update_webhook tools) — flagged as assumption in responses.

import { asList } from "../lib/http.mjs";

const ASSUMPTION_NOTE =
  "ℹ️ Endpoint hors openapi.yaml (vérifié GET le 2026-07-23). Champs de création déduits des conventions : en cas de 400, inspecter le message et ajuster via payload.";

export const webhookTools = [
  {
    name: "list_webhooks",
    description:
      "Liste les webhooks du tenant (endpoint récent, hors openapi.yaml — vérifié en réel). Utile pour brancher Duodeal sur Make/HubSpot sans polling.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => asList(await ctx.api.get("/webhooks")),
  },
  {
    name: "get_webhook",
    description: "Récupère un webhook par id.",
    inputSchema: {
      type: "object",
      properties: { webhookId: { type: "integer" } },
      required: ["webhookId"],
    },
    write: false,
    handler: async (args, ctx) => ctx.api.get(`/webhooks/${args.webhookId}`),
  },
  {
    name: "create_webhook",
    description:
      "Crée un webhook (url de destination + événements). ⚠️ Contrat hors spec : les champs exacts peuvent varier — url est sûr, events/active probables ; compléter via payload si l'API renvoie 400 avec le détail.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL HTTPS appelée par Duodeal" },
        events: { type: "array", items: { type: "string" }, description: "Événements à écouter (si supporté)" },
        payload: { type: "object", description: "Champs supplémentaires exigés par l'API" },
      },
      required: ["url"],
    },
    write: true,
    handler: async (args, ctx) => {
      const created = await ctx.api.post("/webhooks", {
        url: args.url,
        ...(args.events ? { events: args.events } : {}),
        ...(args.payload || {}),
      });
      return { ...created, note: ASSUMPTION_NOTE };
    },
  },
  {
    name: "update_webhook",
    description: "Met à jour un webhook (url, events, actif…). Contrat hors spec — mêmes précautions que create_webhook.",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "integer" },
        payload: { type: "object" },
      },
      required: ["webhookId", "payload"],
    },
    write: true,
    handler: async (args, ctx) => ctx.api.put(`/webhooks/${args.webhookId}`, args.payload),
  },
  {
    name: "delete_webhook",
    description: "Supprime un webhook.",
    inputSchema: {
      type: "object",
      properties: { webhookId: { type: "integer" } },
      required: ["webhookId"],
    },
    write: true,
    handler: async (args, ctx) => {
      await ctx.api.delete(`/webhooks/${args.webhookId}`);
      return { deleted: true, webhookId: args.webhookId };
    },
  },
];
