// Reusable templates (Réglages → Mentions légales / emails): types cgv | notice | email.

import { asList } from "../lib/http.mjs";

export const templateTools = [
  {
    name: "list_templates",
    description:
      "Liste les modèles réutilisables du tenant : type cgv (CGV), notice (mentions légales), email (avec subject + byDefaultSendDeal). Variables disponibles dans content : {{quotation.reference}}, {{customer.firstName}}, {{company.name}}…",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["email", "notice", "cgv"], description: "Optionnel : filtrer par type" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = args.type ? { [`filters[type][eq]`]: args.type } : undefined;
      return asList(await ctx.api.get("/templates", query));
    },
  },
  {
    name: "ensure_template",
    description:
      "Crée ou met à jour un modèle par TITRE (idempotent : si un modèle du même titre et type existe, PUT si le contenu diffère, sinon inchangé). C'est le pattern éprouvé pour enregistrer CGV et mentions légales générées.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["email", "notice", "cgv"] },
        content: { type: "string", description: "HTML du modèle" },
        subject: { type: "string", description: "Pour type email uniquement" },
        byDefaultSendDeal: { type: "boolean", description: "Pour type email : modèle par défaut d'envoi de deal" },
      },
      required: ["title", "type", "content"],
    },
    write: true,
    handler: async (args, ctx) => {
      const existing = asList(await ctx.api.get("/templates", { [`filters[type][eq]`]: args.type })).find(
        (t) => (t.title || "").trim().toLowerCase() === args.title.trim().toLowerCase()
      );
      const body = {
        title: args.title,
        type: args.type,
        content: args.content,
        ...(args.subject !== undefined ? { subject: args.subject } : {}),
        ...(args.byDefaultSendDeal !== undefined ? { byDefaultSendDeal: args.byDefaultSendDeal } : {}),
      };
      if (existing) {
        if (existing.content === args.content && (args.subject === undefined || existing.subject === args.subject)) {
          return { ...existing, ensured: "inchangé (contenu identique)" };
        }
        const updated = await ctx.api.put(`/templates/${existing.id}`, body);
        return { ...updated, ensured: "mis à jour" };
      }
      const created = await ctx.api.post("/templates", body);
      return { ...created, ensured: "créé" };
    },
  },
];
