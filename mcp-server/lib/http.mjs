// Duodeal API client: native fetch + rate limiting + retries + actionable errors.

import { ConfigError } from "./config.mjs";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MIN_INTERVAL_MS = 250; // client-side rate limit: max ~4 req/s
const MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_AUTO_PAGES = 50; // safety bound for listAll

export class ApiError extends Error {
  constructor(status, method, path, body, hint) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    super(`${status} sur ${method} ${path}${detail ? ` — ${truncate(detail, 600)}` : ""}${hint ? `\n💡 ${hint}` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.responseBody = body;
  }
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// Known failure modes → actionable hints (field-tested, see duodeal-api skill §15).
function hintFor(status, method, path, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  if (status === 401) {
    return "X-API-KEY invalide ou vide. La clé est l'UUID BRUT (pas de préfixe « Bearer »). Vérifie le profil actif avec l'outil connection_status.";
  }
  if (status === 400 && path.startsWith("/quotation-lines")) {
    return "Causes fréquentes : tax.id ou unity.id inexistant sur CE tenant (les redécouvrir via list_taxes / list_unities), lineType invalide (seuls normal|title|subtotal existent — pas de « discount » : remise = unitPrice négatif OU discount+discountType), ou weight manquant.";
  }
  if (status === 400 && path.startsWith("/taxes")) {
    return "Le taux de TVA est un décimal entre 0 et 1 (0.20 = 20 %, pas 20).";
  }
  if (status === 409 && method === "DELETE" && path.startsWith("/taxes")) {
    return "Cette taxe est utilisée par des lignes : elle ne peut pas être supprimée.";
  }
  if (status === 400 && method === "DELETE") {
    return "Suppression bloquée par une dépendance (customer avec deals, customer-company avec customers, user propriétaire de deals…). Réassigner ou archiver à la place.";
  }
  if (status === 500 && path.startsWith("/medias")) {
    return "Le POST /medias en fromUrl est instable (beaucoup de CDN → 500) et les fichiers > 4 Mo échouent. Utiliser upload_media (qui télécharge et encode en base64) avec une image ≤ 4 Mo.";
  }
  if (status === 500 && method === "POST" && path === "/quotations") {
    return "POST /quotations nu renvoie 500 (vérifié) : créer le devis via create_deal (createQuotation=true), ou clone_quotation pour une 2ᵉ quotation sur un deal existant.";
  }
  if (status === 429) {
    return "Rate limit atteint côté API — le client a déjà retenté avec backoff ; espacer les appels.";
  }
  if (text.includes("Invalid filter")) {
    return "Syntaxe de filtre : filters[<champ>][<op>]=<valeur> avec op ∈ eq|neq|contains|startsWith|endsWith|gt|gte|lt|lte|like|in.";
  }
  return null;
}

export class DuodealClient {
  /**
   * @param {() => {apiKey, baseUrl, readOnly}} getConnection re-resolved per call (hot profile switch)
   * @param {object} [opts]
   * @param {typeof fetch} [opts.fetchImpl] injectable for tests
   * @param {number} [opts.minIntervalMs]
   * @param {(ms: number) => Promise<void>} [opts.sleep] injectable for tests
   */
  constructor(getConnection, opts = {}) {
    this.getConnection = getConnection;
    this.fetchImpl = opts.fetchImpl || fetch;
    this.minIntervalMs = opts.minIntervalMs ?? Number(process.env.DUODEAL_MIN_INTERVAL_MS || DEFAULT_MIN_INTERVAL_MS);
    this.sleep = opts.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this._queue = Promise.resolve();
    this._lastRequestAt = 0;
  }

  /** Serializes requests and enforces the min interval between them. */
  _throttle() {
    const run = async () => {
      const wait = this._lastRequestAt + this.minIntervalMs - Date.now();
      if (wait > 0) await this.sleep(wait);
      this._lastRequestAt = Date.now();
    };
    const p = this._queue.then(run, run);
    this._queue = p;
    return p;
  }

  /**
   * @param {string} method GET|POST|PUT|DELETE
   * @param {string} path e.g. "/deals/42"
   * @param {object} [opts] {query, body, timeoutMs}
   */
  async request(method, path, { query, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const conn = this.getConnection();
    if (conn.readOnly && method !== "GET") {
      throw new ConfigError(
        `Mode lecture seule actif (profil "${conn.profileName ?? "?"}" ou DUODEAL_READ_ONLY=1) : ` +
          `${method} ${path} refusé. Désactiver readOnly dans ~/.duodeal/config.json pour écrire.`
      );
    }

    const url = new URL(conn.baseUrl.replace(/\/$/, "") + path);
    for (const [k, v] of Object.entries(query || {})) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
        await this.sleep(lastError?.retryAfterMs ?? backoff);
      }
      await this._throttle();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await this.fetchImpl(url, {
          method,
          headers: {
            "X-API-KEY": conn.apiKey,
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            Accept: "application/json",
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (res.ok) return data;

        // Retry only transient statuses; retry writes too — the API is not
        // idempotent on POST, but 429/502/503/504 mean the request was rejected
        // before processing in virtually all cases.
        if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
          const retryAfter = Number(res.headers.get("retry-after"));
          lastError = new ApiError(res.status, method, path, data, hintFor(res.status, method, path, data));
          if (Number.isFinite(retryAfter) && retryAfter > 0) lastError.retryAfterMs = retryAfter * 1000;
          continue;
        }
        throw new ApiError(res.status, method, path, data, hintFor(res.status, method, path, data));
      } catch (err) {
        if (err instanceof ApiError || err instanceof ConfigError) throw err;
        // Network error / timeout → retry
        lastError = err;
        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Erreur réseau sur ${method} ${path} après ${MAX_RETRIES + 1} tentatives : ${err?.message || err}`
          );
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  get(path, query) {
    return this.request("GET", path, { query });
  }
  post(path, body, query) {
    return this.request("POST", path, { body, query });
  }
  put(path, body, query) {
    return this.request("PUT", path, { body, query });
  }
  delete(path) {
    return this.request("DELETE", path);
  }

  /**
   * Fetches every page of a paginated collection endpoint.
   * Normalizes both bare-array and {data:[…]} response shapes.
   */
  async listAll(path, query = {}, { itemsPerPage = 50 } = {}) {
    const all = [];
    for (let page = 1; page <= MAX_AUTO_PAGES; page++) {
      const resp = await this.get(path, { ...query, page, itemsPerPage });
      const items = asList(resp);
      all.push(...items);
      // Prefer the API's own page count ({meta: {pages}}), fall back to short-page heuristic.
      const totalPages = resp?.meta?.pages;
      if (Number.isFinite(totalPages) && page >= totalPages) return all;
      if (items.length < itemsPerPage) return all;
    }
    // Hit the safety bound — say so instead of silently truncating.
    all._truncated = true;
    return all;
  }
}

/** The API returns either [...] or {data|items|results|records|rows: [...]}. */
export function asList(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === "object") {
    for (const key of ["data", "items", "results", "records", "rows"]) {
      if (Array.isArray(resp[key])) return resp[key];
    }
    for (const value of Object.values(resp)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}
