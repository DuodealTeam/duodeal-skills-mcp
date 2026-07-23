// Custom fields + deal views (V1 rendering) + public share links.
// Critical field-tested rule: PUT /deal-views "fields" must be a list of
// STRINGS ("custom_fields_<scope>_<name>", "line_unit_price"…). Dict entries
// are stored but IGNORED by the front (appear unchecked).

import { asList } from "../lib/http.mjs";
import { filterParams } from "./deals.mjs";

const CF_TYPES = [
  "Text", "MultilineText", "RichText", "Number", "Date", "datetime", "Select",
  "MultiSelect", "Image", "User", "Formula", "Html", "HtmlSimple", "System",
];
const CF_SCOPES = ["deal", "customer", "customer-company", "product", "quotation", "quotation-line"];

export const fieldTools = [
  {
    name: "list_custom_fields",
    description:
      'Liste les custom fields du tenant, filtrables par scope (deal, quotation, customer, customer-company, product, quotation-line). Ex filtre : {"scope": "quotation", "name": {"like": "agent_"}}.',
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: CF_SCOPES },
        filters: { type: "object" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = {
        ...(args.scope ? { "filters[scope][eq]": args.scope } : {}),
        ...filterParams(args.filters),
      };
      return asList(await ctx.api.get("/custom-fields", query));
    },
  },
  {
    name: "create_custom_field",
    description:
      "Crée un custom field. name = clé technique SANS espaces ; label = affiché. Pour un CF de quotation visible sur la page, penser à options.display (quotation_informations = bloc Informations en haut ; quotation = corps ; quotation_validation = fenêtre de signature). Select/MultiSelect : options {items: [{label}]}. Formula : formula requise.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Clé sans espaces (ex agent_start_date)" },
        label: { type: "string" },
        type: { type: "string", enum: CF_TYPES },
        scope: { type: "string", enum: CF_SCOPES },
        required: { type: "boolean" },
        payload: {
          type: "object",
          description: "Opt : formula, options {items:[{label}], display}, weight, size (w-full, w-1/2…), editable, public, activate, enableAi",
        },
      },
      required: ["name", "label", "type", "scope"],
    },
    write: true,
    handler: async (args, ctx) => {
      if (/\s/.test(args.name)) throw new Error(`"name" ne doit pas contenir d'espaces : "${args.name}"`);
      if (args.type === "Formula" && !args.payload?.formula) {
        throw new Error('Le type Formula exige "formula" dans payload.');
      }
      return ctx.api.post("/custom-fields", {
        name: args.name,
        label: args.label,
        type: args.type,
        scope: args.scope,
        required: args.required ?? false,
        ...(args.payload || {}),
      });
    },
  },
  {
    name: "list_deal_views",
    description:
      "Liste les deal-views (vues V1 de rendu public : quels champs sont visibles). Resp : id, name, fields (liste de strings), byDefault.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => ctx.api.listAll("/deal-views"),
  },
  {
    name: "update_deal_view_fields",
    description:
      "Rend des champs visibles dans une deal-view (rendu V1). ⚠️ Le format qui MARCHE : fields = liste de STRINGS (« custom_fields_quotation_<name> » pour un CF, noms natifs sinon : line_image, line_unit_price, deal_cgv, quote_total…). L'ordre de la liste = ordre d'affichage. Par défaut FUSIONNE avec l'existant (dédoublonné) ; replace=true pour imposer la liste exacte.",
    inputSchema: {
      type: "object",
      properties: {
        dealViewId: { type: "integer" },
        fields: { type: "array", items: { type: "string" } },
        replace: { type: "boolean", description: "Défaut : false (fusion)" },
      },
      required: ["dealViewId", "fields"],
    },
    write: true,
    handler: async (args, ctx) => {
      const bad = args.fields.filter((f) => typeof f !== "string");
      if (bad.length) throw new Error("fields doit contenir uniquement des STRINGS (les dicts sont ignorés par le front).");
      let fields = args.fields;
      if (!args.replace) {
        const view = await ctx.api.get(`/deal-views/${args.dealViewId}`);
        const existing = (view.fields || []).filter((f) => typeof f === "string");
        fields = [...new Set([...existing, ...args.fields])];
      }
      await ctx.api.put(`/deal-views/${args.dealViewId}`, { fields });
      return { dealViewId: args.dealViewId, fields, note: "Hard reload de la page publique pour voir le changement." };
    },
  },
  {
    name: "create_deal_view_link",
    description:
      "Crée un view link public pour un deal (POST /deal-view-links → uuid). C'est le lien « view » (/deals/{uuid}/{uuid}), distinct du lien client par défaut (/quotations/deal/{uid}) et du share link. Pour la selling page standard, préférer get_links.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "integer" },
        dealViewId: { type: "integer", description: "Une vue de list_deal_views (souvent la byDefault)" },
      },
      required: ["dealId", "dealViewId"],
    },
    write: true,
    handler: async (args, ctx) =>
      ctx.api.post("/deal-view-links", { deal: { id: args.dealId }, dealView: { id: args.dealViewId } }),
  },
];
