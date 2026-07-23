// Quotation lines. Field-tested rules baked in:
// - lineType ∈ normal | title | subtotal ("discount"/"product"/"text" DO NOT exist → 400)
// - discounts: negative unitPrice line OR discount+discountType on a normal line
// - always send weight (display order), tax {id} required
// - totals: baseTotal = unitPrice × quantity × coef ; recomputed server-side on PUT

const LINE_PAYLOAD_DESC =
  "Champs API : productTitle, title (HTML inline, pour lineType=title), description (HTML), quantity (déf 1), unitPrice (déf 0, négatif = remise), coef, discount, discountType (percentage|amount), option (true = « Option non incluse »), hide, unity {id}, product {id}, productPrice {id}, medias [{id}], customFields, blockId (rattachement au bloc pricing V2)";

export const lineTools = [
  {
    name: "list_quotation_lines",
    description:
      "Toutes les lignes d'une quotation, triées par weight (GET /quotation-lines/quote/{id}).",
    inputSchema: {
      type: "object",
      properties: { quotationId: { type: "integer" } },
      required: ["quotationId"],
    },
    write: false,
    handler: async (args, ctx) => ctx.api.get(`/quotation-lines/quote/${args.quotationId}`),
  },
  {
    name: "create_quotation_line",
    description:
      `Crée une ligne de devis. lineType : normal (produit/prix), title (séparateur de section), subtotal (sous-total des lignes précédentes). Remise = unitPrice négatif OU discount+discountType sur une ligne normal (« discount » n'est PAS un lineType). ${LINE_PAYLOAD_DESC}`,
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        lineType: { type: "string", enum: ["normal", "title", "subtotal"] },
        taxId: { type: "integer", description: "Requis par l'API — list_taxes pour les ids du tenant" },
        weight: { type: "integer", description: "Ordre d'affichage — toujours le fournir" },
        payload: { type: "object", description: LINE_PAYLOAD_DESC },
      },
      required: ["quotationId", "lineType", "taxId", "weight"],
    },
    write: true,
    handler: async (args, ctx) => {
      const body = {
        quotation: { id: args.quotationId },
        tax: { id: args.taxId },
        lineType: args.lineType,
        weight: args.weight,
        ...(args.payload || {}),
      };
      // Normalize common shorthand refs if given flat in payload
      for (const ref of ["unity", "product", "productPrice", "parent"]) {
        const flat = body[`${ref}Id`];
        if (flat !== undefined) {
          body[ref] = { id: flat };
          delete body[`${ref}Id`];
        }
      }
      return ctx.api.post("/quotation-lines", body);
    },
  },
  {
    name: "update_quotation_line",
    description:
      "Met à jour une ligne (totaux recalculés automatiquement). Mêmes champs que create_quotation_line.",
    inputSchema: {
      type: "object",
      properties: {
        lineId: { type: "integer" },
        payload: { type: "object", description: LINE_PAYLOAD_DESC },
      },
      required: ["lineId", "payload"],
    },
    write: true,
    handler: async (args, ctx) => ctx.api.put(`/quotation-lines/${args.lineId}`, args.payload),
  },
  {
    name: "delete_quotation_line",
    description: "Supprime une ligne de devis.",
    inputSchema: {
      type: "object",
      properties: { lineId: { type: "integer" } },
      required: ["lineId"],
    },
    write: true,
    handler: async (args, ctx) => {
      await ctx.api.delete(`/quotation-lines/${args.lineId}`);
      return { deleted: true, lineId: args.lineId };
    },
  },
];
