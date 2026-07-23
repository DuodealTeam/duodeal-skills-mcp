import { buildLinks, summarizeBlock } from "../lib/util.mjs";
import { filterParams } from "./deals.mjs";

export const quotationTools = [
  {
    name: "list_quotations",
    description:
      "Liste les quotations (devis) du tenant, paginé + recherche plein texte + filtres. Champs signature : signed, signDate, signerEmail…",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        itemsPerPage: { type: "integer", minimum: 1, maximum: 100 },
        search: { type: "string" },
        filters: { type: "object", description: 'Ex : {"deal.id": 3746} ou {"signed": {"eq": true}}' },
        all: { type: "boolean", description: "true = toutes les pages (borné à 50)" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = {
        page: args.page,
        itemsPerPage: args.itemsPerPage,
        search: args.search,
        ...filterParams(args.filters),
      };
      if (args.all) {
        const items = await ctx.api.listAll("/quotations", query);
        return { count: items.length, truncated: Boolean(items._truncated), quotations: items };
      }
      const resp = await ctx.api.get("/quotations", query);
      return Array.isArray(resp) ? { count: resp.length, quotations: resp } : resp;
    },
  },
  {
    name: "get_quotation",
    description:
      "Récupère une quotation par id. Par défaut les blocs V2 sont RÉSUMÉS (id, type, titre, taille) pour ne pas noyer le contexte — fullBlocks=true pour le contenu intégral, ou get_quotation_block pour un seul bloc.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        fullBlocks: { type: "boolean", description: "Défaut : false (blocs résumés)" },
      },
      required: ["quotationId"],
    },
    write: false,
    handler: async (args, ctx) => {
      const q = await ctx.api.get(`/quotations/${args.quotationId}`);
      if (!args.fullBlocks && Array.isArray(q.blocks)) {
        return {
          ...q,
          blocks: q.blocks.map(summarizeBlock),
          blocksNote: "Blocs résumés — fullBlocks=true ou get_quotation_block pour le détail.",
        };
      }
      return q;
    },
  },
  {
    name: "update_quotation",
    description:
      "Met à jour une quotation : title, validUntil, discount, signer, logo/cover (media id), legalNoticeText/legalMentionText, customFields… Les customFields sont FUSIONNÉS avec l'existant (l'API remplace tout le dict : le tool relit puis fusionne — replaceCustomFields=true pour remplacer). ⚠️ Les blocs V2 passent par les outils *_quotation_block, pas ici.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        payload: {
          type: "object",
          description:
            "Champs à modifier, format API : {title, description, validUntil (YYYY-MM-DD), customFields {clé: valeur}, discount, discountType (percentage|amount), signerFirstName/LastName/Email, primaryQuotation, noCover, noLogo, legalNoticeText, legalMentionText, logo {id}, cover {id}}",
        },
        replaceCustomFields: { type: "boolean", description: "true = remplacer le dict entier (défaut : fusion)" },
        bulk: { type: "boolean", description: "true = ?bulk=1 (met aussi à jour les lignes incluses)" },
      },
      required: ["quotationId", "payload"],
    },
    write: true,
    handler: async (args, ctx) => {
      const payload = { ...args.payload };
      if ("blocks" in payload || "builderVersion" in payload) {
        throw new Error(
          "Refusé : « blocks »/« builderVersion » ne se modifient pas via update_quotation (risque d'écraser le travail de l'éditeur V2). Utiliser add/update/delete/reorder_quotation_block ou replace_quotation_block_text — ils relisent et fusionnent."
        );
      }
      if (payload.customFields && !args.replaceCustomFields) {
        const existing = await ctx.api.get(`/quotations/${args.quotationId}`);
        payload.customFields = { ...(existing.customFields || {}), ...payload.customFields };
      }
      return ctx.api.put(`/quotations/${args.quotationId}`, payload, args.bulk ? { bulk: 1 } : undefined);
    },
  },
  {
    name: "clone_quotation",
    description:
      "Clone une quotation DANS son deal (POST /quotations/{id}/clone). C'est le seul moyen d'ajouter une 2ᵉ quotation à un deal existant (POST /quotations nu → 500). Puis update_quotation sur le clone (title, primaryQuotation…).",
    inputSchema: {
      type: "object",
      properties: { quotationId: { type: "integer", description: "Quotation source du même deal" } },
      required: ["quotationId"],
    },
    write: true,
    handler: async (args, ctx) => ctx.api.post(`/quotations/${args.quotationId}/clone`),
  },
  {
    name: "delete_quotation",
    description: "Supprime une quotation. Réservé au nettoyage de comptes de test/démo.",
    inputSchema: {
      type: "object",
      properties: { quotationId: { type: "integer" } },
      required: ["quotationId"],
    },
    write: true,
    handler: async (args, ctx) => {
      await ctx.api.delete(`/quotations/${args.quotationId}`);
      return { deleted: true, quotationId: args.quotationId };
    },
  },
  {
    name: "get_links",
    description:
      "Donne les liens à livrer pour un deal : clientLink (selling page par défaut envoyée au prospect, /quotations/deal/{uid}) + editionLink (éditeur V2 interne, /app/quotations/{dealId}/{quotationId}). Toujours livrer les deux. Ne pas confondre avec share link (/quotations/share/{uuid}) ni view link (/deals/{uuid}/{uuid}).",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "integer" },
        quotationId: { type: "integer", description: "Optionnel — défaut : quotation primaire du deal" },
      },
      required: ["dealId"],
    },
    write: false,
    handler: async (args, ctx) => {
      const deal = await ctx.api.get(`/deals/${args.dealId}`);
      return {
        dealId: deal.id,
        dealName: deal.name,
        ...buildLinks(ctx.getConnection().appUrl, deal, args.quotationId),
      };
    },
  },
];
