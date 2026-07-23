// Catalog: products, product prices, price categories, taxes, unities.
// create_* tools are idempotent by default ("ensure" pattern: list → match → create),
// which prevents 400s on unknown ids and duplicates on re-runs.

import { asList } from "../lib/http.mjs";
import { filterParams } from "./deals.mjs";

const norm = (s) => (s || "").trim().toLowerCase();

export const catalogTools = [
  {
    name: "list_products",
    description: 'Liste le catalogue produits (paginé + filtres, ex {"active": true}).',
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        itemsPerPage: { type: "integer", minimum: 1, maximum: 100 },
        filters: { type: "object" },
        all: { type: "boolean" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = { page: args.page, itemsPerPage: args.itemsPerPage, ...filterParams(args.filters) };
      if (args.all) {
        const items = await ctx.api.listAll("/products", query);
        return { count: items.length, products: items };
      }
      const resp = await ctx.api.get("/products", query);
      return Array.isArray(resp) ? { count: resp.length, products: resp } : resp;
    },
  },
  {
    name: "create_product",
    description:
      "Crée un produit (name requis). Opt via payload : reference, description, active, url, tips, unity {id}, medias [{id}], customFields. Les prix se posent ensuite avec create_product_price.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        payload: { type: "object" },
      },
      required: ["name"],
    },
    write: true,
    handler: async (args, ctx) => ctx.api.post("/products", { name: args.name, ...(args.payload || {}) }),
  },
  {
    name: "create_product_price",
    description:
      "Pose un prix sur un produit pour une catégorie de prix. ⚠️ UN SEUL prix par couple (produit × catégorie) sinon 400. Les paliers de volume = une catégorie nommée par palier (« 0-100 », « 100-500 »…).",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "integer" },
        priceCategoryId: { type: "integer" },
        price: { type: "number" },
        taxId: { type: "integer" },
      },
      required: ["productId", "priceCategoryId", "price"],
    },
    write: true,
    handler: async (args, ctx) =>
      ctx.api.post("/product-prices", {
        product: { id: args.productId },
        priceCategory: { id: args.priceCategoryId },
        price: args.price,
        ...(args.taxId ? { tax: { id: args.taxId } } : {}),
      }),
  },
  {
    name: "list_price_categories",
    description: "Liste les catégories de prix du tenant (id, name, byDefault).",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => asList(await ctx.api.get("/price-categories")),
  },
  {
    name: "create_price_category",
    description:
      "Crée une catégorie de prix — idempotent : si une catégorie du même nom EXACT existe, la renvoie sans dupliquer. DELETE d'une catégorie → cascade sur ses product-prices.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        byDefault: { type: "boolean" },
        taxId: { type: "integer" },
        ensure: { type: "boolean", description: "Défaut true (list → match → create)" },
      },
      required: ["name"],
    },
    write: true,
    handler: async (args, ctx) => {
      if (args.ensure !== false) {
        const existing = asList(await ctx.api.get("/price-categories")).find((c) => norm(c.name) === norm(args.name));
        if (existing) return { ...existing, ensured: "existant réutilisé" };
      }
      return ctx.api.post("/price-categories", {
        name: args.name.trim(),
        ...(args.byDefault !== undefined ? { byDefault: args.byDefault } : {}),
        ...(args.taxId ? { tax: { id: args.taxId } } : {}),
      });
    },
  },
  {
    name: "list_taxes",
    description: "Liste les taxes du tenant (id, name, rate décimal 0–1, byDefault). À faire avant toute création de ligne.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => asList(await ctx.api.get("/taxes")),
  },
  {
    name: "create_tax",
    description:
      "Crée une taxe — idempotent : réutilise l'existante si même nom OU même taux (±0.001). ⚠️ rate = DÉCIMAL entre 0 et 1 (0.20 = 20 %, 0.055 = 5,5 %).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        rate: { type: "number", minimum: 0, maximum: 1 },
        byDefault: { type: "boolean" },
        ensure: { type: "boolean", description: "Défaut true" },
      },
      required: ["name", "rate"],
    },
    write: true,
    handler: async (args, ctx) => {
      if (args.ensure !== false) {
        const existing = asList(await ctx.api.get("/taxes")).find(
          (t) => norm(t.name) === norm(args.name) || Math.abs(Number(t.rate) - args.rate) < 0.001
        );
        if (existing) return { ...existing, ensured: "existante réutilisée" };
      }
      return ctx.api.post("/taxes", {
        name: args.name.trim(),
        rate: args.rate,
        ...(args.byDefault !== undefined ? { byDefault: args.byDefault } : {}),
      });
    },
  },
  {
    name: "list_unities",
    description: "Liste les unités du tenant (« Unité », « Mois », « Heure »…).",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => asList(await ctx.api.get("/unities")),
  },
  {
    name: "create_unity",
    description: "Crée une unité — idempotent : réutilise l'existante à nom égal (insensible à la casse).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        ensure: { type: "boolean", description: "Défaut true" },
      },
      required: ["name"],
    },
    write: true,
    handler: async (args, ctx) => {
      if (args.ensure !== false) {
        const existing = asList(await ctx.api.get("/unities")).find((u) => norm(u.name) === norm(args.name));
        if (existing) return { ...existing, ensured: "existante réutilisée" };
      }
      return ctx.api.post("/unities", { name: args.name.trim() });
    },
  },
];
