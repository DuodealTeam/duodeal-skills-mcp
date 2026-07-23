import crypto from "node:crypto";

export const uuid = () => crypto.randomUUID();

/**
 * Recursively masks any "apiKey" field in API responses (GET /users/me exposes
 * the raw key) so keys never land in the conversation.
 */
export function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = /apikey|api_key|password|secret|token/i.test(k) && typeof v === "string"
        ? "•••masquée•••"
        : redactSecrets(v);
    }
    return out;
  }
  return value;
}

/**
 * Builds the two links to always hand over when a quotation is delivered.
 * Edition link is the V2 editor (`/app/quotations/…`); the old `/app/deals/…`
 * path opens the V1 editor and must not be used.
 */
export function buildLinks(appUrl, deal, quotationId) {
  const base = appUrl.replace(/\/$/, "");
  const qid = quotationId ?? deal.primaryQuotationId ?? deal.quotations?.[0]?.id ?? null;
  return {
    editionLink: qid ? `${base}/app/quotations/${deal.id}/${qid}` : null,
    clientLink: deal.uid ? `${base}/quotations/deal/${deal.uid}` : null,
    note: "Toujours livrer les 2 liens : clientLink (selling page envoyée au prospect) + editionLink (éditeur V2 interne).",
  };
}

/** Shallow-merge that treats nested plain objects one level deep (customFields, data…). */
export function mergeShallow(existing, patch) {
  return { ...(existing || {}), ...(patch || {}) };
}

/** Reads a dotted path ("data.columns.0") inside an object. */
export function getPath(obj, dotted) {
  return dotted.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** Writes a dotted path inside an object (mutates), creating nothing: path must exist except the leaf. */
export function setPath(obj, dotted, value) {
  const keys = dotted.split(".");
  const leaf = keys.pop();
  const parent = keys.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  if (parent == null || typeof parent !== "object") {
    throw new Error(`Chemin introuvable : "${dotted}" (le parent n'existe pas)`);
  }
  parent[leaf] = value;
}

/** Compact JSON for tool output, pretty enough to read. */
export function toText(data) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

/** Summarizes a block for compact listings (blocks' data can be huge HTML). */
export function summarizeBlock(block, index) {
  const dataSize = JSON.stringify(block.data ?? {}).length;
  return {
    index,
    id: block.id,
    type: block.type,
    title: block.title || "",
    visible: block.visible !== false,
    dataSize,
    dataKeys: Object.keys(block.data || {}),
  };
}
