// Unit + integration tests — no network, no API key needed.
// Run: node --test  (from mcp-server/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateInput } from "../lib/validate.mjs";
import { redactSecrets, buildLinks, getPath, setPath, summarizeBlock } from "../lib/util.mjs";
import { DuodealClient, asList } from "../lib/http.mjs";
import { filterParams } from "../tools/deals.mjs";
import { blockWarnings, KNOWN_BLOCK_TYPES } from "../tools/blocks.mjs";
import { allTools } from "../tools/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- validate ----------

test("validateInput: required, enum, type, bounds", () => {
  const schema = {
    type: "object",
    required: ["name", "rate"],
    properties: {
      name: { type: "string" },
      rate: { type: "number", minimum: 0, maximum: 1 },
      lineType: { type: "string", enum: ["normal", "title", "subtotal"] },
      ids: { type: "array", items: { type: "string" } },
    },
  };
  assert.equal(validateInput(schema, { name: "TVA", rate: 0.2 }).length, 0);
  assert.match(validateInput(schema, { rate: 0.2 })[0], /name/);
  assert.match(validateInput(schema, { name: "x", rate: 20 })[0], /≤ 1/);
  assert.match(validateInput(schema, { name: "x", rate: 0.2, lineType: "discount" })[0], /normal \| title \| subtotal/);
  assert.match(validateInput(schema, { name: "x", rate: 0.2, ids: [1] })[0], /ids\[0\]/);
});

// ---------- util ----------

test("redactSecrets masks api keys at any depth", () => {
  const out = redactSecrets({ id: 1, apiKey: "uuid-secret", nested: { API_KEY: "x", ok: "keep" } });
  assert.equal(out.apiKey, "•••masquée•••");
  assert.equal(out.nested.API_KEY, "•••masquée•••");
  assert.equal(out.nested.ok, "keep");
});

test("buildLinks: V2 edition link + client link from deal uid", () => {
  const links = buildLinks("https://duodeal.app", {
    id: 3746,
    uid: "0198-abc",
    primaryQuotationId: 4529,
  });
  assert.equal(links.editionLink, "https://duodeal.app/app/quotations/3746/4529");
  assert.equal(links.clientLink, "https://duodeal.app/quotations/deal/0198-abc");
  assert.ok(!links.editionLink.includes("/app/deals/"), "must never build the V1 editor path");
});

test("getPath/setPath dotted access", () => {
  const obj = { columns: ["<p>a</p>", "<p>b</p>"], nested: { code: "x" } };
  assert.equal(getPath(obj, "columns.1"), "<p>b</p>");
  setPath(obj, "nested.code", "y");
  assert.equal(obj.nested.code, "y");
  assert.throws(() => setPath(obj, "missing.path.leaf", 1), /introuvable/);
});

test("summarizeBlock keeps ids and sizes, drops content", () => {
  const s = summarizeBlock({ id: "b1", type: "html", data: { code: "x".repeat(500) } }, 0);
  assert.equal(s.id, "b1");
  assert.ok(s.dataSize > 400);
  assert.equal(s.dataKeys[0], "code");
  assert.equal("code" in s, false);
});

// ---------- filters ----------

test("filterParams serialization + eq shorthand", () => {
  const q = filterParams({ "customer.email": { contains: "@acme" }, signed: true });
  assert.equal(q["filters[customer.email][contains]"], "@acme");
  assert.equal(q["filters[signed][eq]"], true);
});

// ---------- http client ----------

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function makeClient(fetchImpl, conn = {}) {
  return new DuodealClient(
    () => ({
      apiKey: "test-key",
      baseUrl: "https://api.example.test/api",
      appUrl: "https://duodeal.app",
      readOnly: false,
      profileName: "test",
      keySource: "test",
      ...conn,
    }),
    { fetchImpl, minIntervalMs: 0, sleep: async () => {} }
  );
}

test("client sends X-API-KEY and parses JSON", async () => {
  const calls = [];
  const client = makeClient(async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return jsonResponse(200, { id: 42 });
  });
  const data = await client.get("/deals/42");
  assert.equal(data.id, 42);
  assert.equal(calls[0].headers["X-API-KEY"], "test-key");
  assert.equal(calls[0].url, "https://api.example.test/api/deals/42");
});

test("client retries 503 then succeeds", async () => {
  let n = 0;
  const client = makeClient(async () => (++n < 3 ? jsonResponse(503, { err: "busy" }) : jsonResponse(200, { ok: true })));
  const data = await client.get("/taxes");
  assert.equal(data.ok, true);
  assert.equal(n, 3);
});

test("client does NOT retry 400 and includes hint for quotation-lines", async () => {
  let n = 0;
  const client = makeClient(async () => {
    n++;
    return jsonResponse(400, { message: "invalid" });
  });
  await assert.rejects(
    () => client.post("/quotation-lines", { lineType: "discount" }),
    (err) => err.status === 400 && /tax\.id ou unity\.id/.test(err.message)
  );
  assert.equal(n, 1);
});

test("client gives up after retries on persistent 429", async () => {
  let n = 0;
  const client = makeClient(async () => {
    n++;
    return jsonResponse(429, { err: "slow down" }, { "retry-after": "0" });
  });
  await assert.rejects(() => client.get("/deals"), (err) => err.status === 429);
  assert.equal(n, 4); // initial + 3 retries
});

test("read-only mode blocks writes but allows GET", async () => {
  const client = makeClient(async () => jsonResponse(200, { ok: true }), { readOnly: true });
  assert.equal((await client.get("/deals")).ok, true);
  await assert.rejects(() => client.put("/deals/1", { name: "x" }), /lecture seule/);
});

test("asList normalizes bare arrays and wrapped shapes", () => {
  assert.deepEqual(asList([1, 2]), [1, 2]);
  assert.deepEqual(asList({ data: [3] }), [3]);
  assert.deepEqual(asList({ items: [4] }), [4]);
  assert.deepEqual(asList({ weird: [5] }), [5]);
  assert.deepEqual(asList(null), []);
});

test("listAll paginates until a short page", async () => {
  const pages = { 1: Array.from({ length: 50 }, (_, i) => ({ id: i })), 2: [{ id: 50 }] };
  const client = makeClient(async (url) => {
    const page = new URL(url).searchParams.get("page");
    return jsonResponse(200, { data: pages[page] || [] });
  });
  const all = await client.listAll("/deals");
  assert.equal(all.length, 51);
});

// ---------- blocks ----------

test("block warnings: html without autoResize, faq with HTML, pricing blockId note", () => {
  assert.match(blockWarnings({ type: "html", data: { code: "<div>x</div>" } })[0], /autoResize/);
  assert.equal(blockWarnings({ type: "html", data: { code: "DuoDeal.autoResize()" } }).length, 0);
  assert.match(blockWarnings({ type: "faq", data: { items: [{ question: "<b>Q</b>", answer: "A" }] } })[0], /TEXTE BRUT/);
  assert.match(blockWarnings({ id: "p1", type: "pricing", data: {} })[0], /blockId="p1"/);
  assert.ok(KNOWN_BLOCK_TYPES.includes("wysiwyg"));
});

// ---------- tool registry ----------

test("tool registry: unique names, schemas and handlers present", () => {
  const names = new Set();
  for (const tool of allTools) {
    assert.ok(!names.has(tool.name), `duplicate: ${tool.name}`);
    names.add(tool.name);
    assert.equal(typeof tool.description, "string");
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(typeof tool.handler, "function");
    assert.equal(typeof tool.write, "boolean");
  }
  assert.ok(allTools.length >= 40, `expected a full toolset, got ${allTools.length}`);
});

// ---------- integration: real stdio server ----------

test("stdio server answers initialize and tools/list without any API key", async () => {
  const serverPath = path.join(__dirname, "..", "index.mjs");
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("DUODEAL_")));
  const child = spawn(process.execPath, [serverPath], { env, stdio: ["pipe", "pipe", "pipe"] });

  const responses = [];
  let buffer = "";
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) responses.push(JSON.parse(line));
    }
  });

  const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_taxes", arguments: {} } });

  await new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`timeout — got ${responses.length} responses`)), 5000);
    const poll = setInterval(() => {
      if (responses.length >= 3) {
        clearTimeout(deadline);
        clearInterval(poll);
        resolve();
      }
    }, 25);
  }).finally(() => child.kill());

  const init = responses.find((r) => r.id === 1);
  assert.equal(init.result.serverInfo.name, "duodeal");
  assert.equal(init.result.protocolVersion, "2025-06-18");

  const list = responses.find((r) => r.id === 2);
  assert.ok(list.result.tools.length >= 40);
  assert.ok(list.result.tools.every((t) => t.name && t.inputSchema));

  // Without a key, a tool call must return a clean actionable error, not crash.
  const call = responses.find((r) => r.id === 3);
  assert.equal(call.result.isError, true);
  assert.match(call.result.content[0].text, /Aucune clé API Duodeal configurée/);
});
