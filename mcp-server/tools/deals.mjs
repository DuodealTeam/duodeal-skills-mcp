import { asList } from "../lib/http.mjs";
import { buildLinks } from "../lib/util.mjs";

/** Serializes {field: {op: value}} into filters[field][op]=value query params. */
export function filterParams(filters) {
  const out = {};
  for (const [field, ops] of Object.entries(filters || {})) {
    if (ops && typeof ops === "object" && !Array.isArray(ops)) {
      for (const [op, value] of Object.entries(ops)) out[`filters[${field}][${op}]`] = value;
    } else {
      out[`filters[${field}][eq]`] = ops; // shorthand: {field: value} means eq
    }
  }
  return out;
}

const FILTERS_DESC =
  'Filtres API, format {"champ": {"op": valeur}} — op ∈ eq|neq|contains|startsWith|endsWith|gt|gte|lt|lte|like|in. Champs relationnels (customer.email) et custom fields (customFields.clé) acceptés. Raccourci {"champ": valeur} = eq.';

export const dealTools = [
  {
    name: "list_deals",
    description:
      "Liste les deals du tenant (paginé). search = recherche plein texte FR/EN (nom, numéro, contact, client). Un deal sans quotation n'apparaît PAS dans cette liste.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        itemsPerPage: { type: "integer", minimum: 1, maximum: 100, description: "Défaut API : 10" },
        search: { type: "string" },
        archived: { type: "boolean" },
        template: { type: "boolean", description: "true = uniquement les templates (⚠️ filtre parfois ignoré par l'API : revérifier le flag template sur chaque résultat)" },
        filters: { type: "object", description: FILTERS_DESC },
        all: { type: "boolean", description: "true = récupère TOUTES les pages (borné à 50 pages)" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = {
        page: args.page,
        itemsPerPage: args.itemsPerPage,
        search: args.search,
        archived: args.archived,
        template: args.template,
        ...filterParams(args.filters),
      };
      if (args.all) {
        const items = await ctx.api.listAll("/deals", query);
        return { count: items.length, truncated: Boolean(items._truncated), deals: items };
      }
      const resp = await ctx.api.get("/deals", query);
      return Array.isArray(resp) ? { count: resp.length, deals: resp } : resp;
    },
  },
  {
    name: "get_deal",
    description:
      "Récupère un deal complet par id : uid (UUID public), number, customer, quotations[], liens. Ajoute les liens prêts à livrer (éditeur V2 + selling page client).",
    inputSchema: {
      type: "object",
      properties: { dealId: { type: "integer" } },
      required: ["dealId"],
    },
    write: false,
    handler: async (args, ctx) => {
      const deal = await ctx.api.get(`/deals/${args.dealId}`);
      return { ...deal, links: buildLinks(ctx.getConnection().appUrl, deal) };
    },
  },
  {
    name: "create_deal",
    description:
      "Crée un deal. Par défaut createQuotation=true (crée la quotation vide en même temps — indispensable : un deal sans quotation est invisible dans la liste). ⚠️ POST /quotations nu renvoie 500 : c'est ICI que naissent les devis.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        customerId: { type: "integer", description: "Contact destinataire (customer)" },
        ownerId: { type: "integer", description: "User commercial propriétaire" },
        template: { type: "boolean", description: "true = créer comme template" },
        language: { type: "string", enum: ["fr", "en"] },
        createQuotation: { type: "boolean", description: "Défaut : true" },
      },
      required: ["name"],
    },
    write: true,
    handler: async (args, ctx) => {
      const body = {
        name: args.name,
        ...(args.customerId ? { customer: { id: args.customerId } } : {}),
        ...(args.ownerId ? { owner: { id: args.ownerId } } : {}),
        ...(args.template !== undefined ? { template: args.template } : {}),
        ...(args.language ? { language: args.language } : {}),
      };
      const createQuotation = args.createQuotation !== false;
      const deal = await ctx.api.post("/deals", body, createQuotation ? { createquotation: 1 } : undefined);
      return { ...deal, links: buildLinks(ctx.getConnection().appUrl, deal) };
    },
  },
  {
    name: "update_deal",
    description: "Met à jour un deal : name, customer, owner, archived, template, language.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "integer" },
        name: { type: "string" },
        customerId: { type: "integer" },
        ownerId: { type: "integer" },
        archived: { type: "boolean" },
        template: { type: "boolean" },
        language: { type: "string", enum: ["fr", "en"] },
      },
      required: ["dealId"],
    },
    write: true,
    handler: async (args, ctx) => {
      const body = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.customerId !== undefined) body.customer = { id: args.customerId };
      if (args.ownerId !== undefined) body.owner = { id: args.ownerId };
      if (args.archived !== undefined) body.archived = args.archived;
      if (args.template !== undefined) body.template = args.template;
      if (args.language !== undefined) body.language = args.language;
      return ctx.api.put(`/deals/${args.dealId}`, body);
    },
  },
  {
    name: "clone_deal",
    description:
      "Clone un deal complet (deal + quotations + lignes + blocs V2, les ids de blocs sont préservés). C'est LE moyen de partir d'un template.",
    inputSchema: {
      type: "object",
      properties: { dealId: { type: "integer", description: "Deal source (souvent un template)" } },
      required: ["dealId"],
    },
    write: true,
    handler: async (args, ctx) => {
      const deal = await ctx.api.post(`/deals/clone/${args.dealId}`);
      return { ...deal, links: buildLinks(ctx.getConnection().appUrl, deal) };
    },
  },
  {
    name: "delete_deal",
    description: "Supprime un deal (soft delete côté API). Réservé au nettoyage de comptes de test/démo.",
    inputSchema: {
      type: "object",
      properties: { dealId: { type: "integer" } },
      required: ["dealId"],
    },
    write: true,
    handler: async (args, ctx) => {
      await ctx.api.delete(`/deals/${args.dealId}`);
      return { deleted: true, dealId: args.dealId };
    },
  },
];

export { asList };
