#!/usr/bin/env node
// Duodeal MCP server — stdio, zero dependencies (Node ≥ 18 for native fetch).
// Auth: X-API-KEY resolved from env or ~/.duodeal/config.json profiles (see lib/config.mjs).

import { serveStdio } from "./lib/rpc.mjs";
import { resolveConnection, ConfigError } from "./lib/config.mjs";
import { DuodealClient, ApiError } from "./lib/http.mjs";
import { validateInput } from "./lib/validate.mjs";
import { toText } from "./lib/util.mjs";
import { allTools, toolByName } from "./tools/index.mjs";

const SERVER_INFO = { name: "duodeal", version: "0.1.0" };

const INSTRUCTIONS = `Serveur MCP Duodeal (api.duodeal.app). Règles d'usage :
- En cas de doute sur le compte branché, appeler connection_status d'abord (profils multi-tenant : list_profiles / use_profile).
- Écritures réservées aux comptes de test/démo ; jamais un tenant client réel sans demande explicite.
- Les devis naissent via create_deal (createQuotation=true) — POST /quotations nu échoue (500).
- customFields et blocs V2 : les outils fusionnent avec l'existant, ne jamais contourner via api_call en PUT direct.
- Quand un devis est livré, toujours donner les 2 liens via get_links (clientLink + editionLink).
- Référence API complète : skill duodeal-api-reference · blocs V2 : skill duodeal-v2-blocks.`;

// The connection is re-resolved on every call so use_profile applies instantly.
const getConnection = () => resolveConnection();
const api = new DuodealClient(getConnection);
const ctx = { api, getConnection };

function textResult(text, isError = false) {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) };
}

serveStdio({
  serverInfo: SERVER_INFO,
  instructions: INSTRUCTIONS,
  listTools: () =>
    allTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  callTool: async (name, args) => {
    const tool = toolByName.get(name);
    if (!tool) {
      return textResult(`Outil inconnu : ${name}. Outils disponibles : ${allTools.map((t) => t.name).join(", ")}`, true);
    }

    const problems = validateInput(tool.inputSchema, args);
    if (problems.length) {
      return textResult(`Paramètres invalides pour ${name} :\n- ${problems.join("\n- ")}`, true);
    }

    // Read-only guard for tools that are always writes. Tools with a dynamic
    // isWriteCall predicate (api_call) delegate to the HTTP client's own guard.
    if (tool.write && !tool.isWriteCall) {
      try {
        const conn = getConnection();
        if (conn.readOnly) {
          return textResult(
            `Mode lecture seule actif : ${name} est un outil d'écriture. Désactiver readOnly (profil ou DUODEAL_READ_ONLY) pour continuer.`,
            true
          );
        }
      } catch (err) {
        return textResult(`❌ ${err.message}`, true);
      }
    }

    try {
      const result = await tool.handler(args, ctx);
      return textResult(toText(result));
    } catch (err) {
      if (err instanceof ConfigError) return textResult(`❌ Configuration : ${err.message}`, true);
      if (err instanceof ApiError) return textResult(`❌ API Duodeal : ${err.message}`, true);
      return textResult(`❌ ${err?.message || err}`, true);
    }
  },
});

process.stderr.write(`[duodeal-mcp] ready (${allTools.length} tools)\n`);
