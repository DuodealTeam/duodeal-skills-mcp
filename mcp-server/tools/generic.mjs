// Escape hatch — the equivalent of Make's "Make an API Call" module.
// Same auth, rate limiting, retries and read-only guard as every other tool.

import { redactSecrets } from "../lib/util.mjs";

export const genericTools = [
  {
    name: "api_call",
    description:
      "Appel API Duodeal libre, pour tout endpoint non couvert par les autres outils (équivalent du module « Make an API Call »). Auth, retries et rate limiting appliqués. Conventions : réfs imbriquées {\"entity\": {\"id\": N}} (jamais entity_id), dates ISO YYYY-MM-DD, taux TVA en décimal 0–1, filtres filters[champ][op]=valeur. Spec complète : skill duodeal-api-reference. ⚠️ PUT /quotations/{id} avec customFields ou blocks REMPLACE tout le dict/tableau — préférer update_quotation et les outils *_quotation_block qui fusionnent.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
        path: { type: "string", description: 'Chemin relatif commençant par "/", ex "/deals/42" ou "/pins"' },
        query: { type: "object", description: "Paramètres de query string (page, itemsPerPage, filters[x][op]…)" },
        body: { type: "object", description: "Corps JSON pour POST/PUT" },
      },
      required: ["method", "path"],
    },
    write: true, // conservative: blocked in read-only mode unless method is GET (checked below)
    handler: async (args, ctx) => {
      if (!args.path.startsWith("/")) {
        throw new Error(`path doit commencer par "/" (reçu : "${args.path}") — relatif à ${ctx.getConnection().baseUrl}`);
      }
      if (/^https?:/i.test(args.path)) {
        throw new Error("path est un chemin relatif à l'API Duodeal, pas une URL complète.");
      }
      const result = await ctx.api.request(args.method, args.path, {
        query: args.query,
        body: args.body,
      });
      return redactSecrets(result);
    },
    // GET api_call must work in read-only mode; writes stay blocked by the client itself.
    isWriteCall: (args) => args?.method !== "GET",
  },
];
