// Minimal MCP stdio transport: newline-delimited JSON-RPC 2.0.
// Zero dependencies — implements just what an MCP tools server needs:
// initialize / notifications/initialized / ping / tools/list / tools/call.

const JSONRPC = "2.0";
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";

export const RpcError = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

/**
 * Runs an MCP server over stdio.
 *
 * @param {object} opts
 * @param {{name: string, version: string}} opts.serverInfo
 * @param {string} [opts.instructions] shown to the client model after initialize
 * @param {() => Array<{name, description, inputSchema}>} opts.listTools
 * @param {(name: string, args: object) => Promise<{content: any[], isError?: boolean}>} opts.callTool
 */
export function serveStdio({ serverInfo, instructions, listTools, callTool }) {
  let buffer = "";

  const send = (msg) => {
    process.stdout.write(JSON.stringify(msg) + "\n");
  };

  const reply = (id, result) => send({ jsonrpc: JSONRPC, id, result });
  const replyError = (id, code, message, data) =>
    send({ jsonrpc: JSONRPC, id, error: { code, message, ...(data !== undefined ? { data } : {}) } });

  async function handle(msg) {
    const { id, method, params } = msg;
    const isRequest = id !== undefined && id !== null;

    try {
      switch (method) {
        case "initialize": {
          const requested = params?.protocolVersion;
          const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
            ? requested
            : DEFAULT_PROTOCOL_VERSION;
          reply(id, {
            protocolVersion,
            capabilities: { tools: {} },
            serverInfo,
            ...(instructions ? { instructions } : {}),
          });
          return;
        }
        case "notifications/initialized":
        case "notifications/cancelled":
        case "notifications/roots/list_changed":
          return; // notifications: no response
        case "ping":
          if (isRequest) reply(id, {});
          return;
        case "tools/list":
          reply(id, { tools: listTools() });
          return;
        case "tools/call": {
          const name = params?.name;
          const args = params?.arguments ?? {};
          if (typeof name !== "string" || name.length === 0) {
            replyError(id, RpcError.INVALID_PARAMS, "tools/call requires params.name");
            return;
          }
          const result = await callTool(name, args);
          reply(id, result);
          return;
        }
        default:
          if (isRequest) replyError(id, RpcError.METHOD_NOT_FOUND, `Method not found: ${method}`);
      }
    } catch (err) {
      // Unexpected server bug — surface as a protocol error, never crash the process.
      if (isRequest) {
        replyError(id, RpcError.INTERNAL_ERROR, err?.message || String(err));
      } else {
        process.stderr.write(`[duodeal-mcp] error in notification handler: ${err?.stack || err}\n`);
      }
    }
  }

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        send({
          jsonrpc: JSONRPC,
          id: null,
          error: { code: RpcError.PARSE_ERROR, message: "Parse error" },
        });
        continue;
      }
      void handle(msg);
    }
  });
  process.stdin.on("end", () => process.exit(0));
}

/** Parses one raw line into a JSON-RPC message. Exported for tests. */
export function parseLine(line) {
  return JSON.parse(line);
}
