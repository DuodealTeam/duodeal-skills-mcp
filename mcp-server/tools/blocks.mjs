// Quotation V2 blocks (builderVersion 2). Contract is NOT in openapi.yaml —
// verified empirically (see V2-BLOCS.md):
// - read: GET /quotations/{id} → key "blocks"
// - write: PUT /quotations/{id} {builderVersion: 2, blocks: [...]}
//   ⚠️ the sent array REPLACES everything → every tool here re-reads then merges,
//   never blind-writes (the V2 editor is used in parallel by the team).
// - block ids are client-generated UUIDs, persisted as-is
// - quotation lines attach to a pricing block via blockId

import { uuid, getPath, setPath, summarizeBlock } from "../lib/util.mjs";

export const KNOWN_BLOCK_TYPES = [
  "header", "contacts", "wysiwyg", "html", "pricing", "customfields",
  "attachments", "legalnotice", "paymentschedule", "pdfviewer", "youtube",
  "faq", "pptx", "googleslides", "canva", "gallery", "accept", "signstamp", "pagebreak",
];

async function readBlocks(ctx, quotationId) {
  const q = await ctx.api.get(`/quotations/${quotationId}`);
  return { quotation: q, blocks: Array.isArray(q.blocks) ? q.blocks : [] };
}

function writeBlocks(ctx, quotationId, blocks) {
  return ctx.api.put(`/quotations/${quotationId}`, { builderVersion: 2, blocks });
}

function findBlock(blocks, blockId) {
  const index = blocks.findIndex((b) => b.id === blockId);
  if (index === -1) {
    const known = blocks.map((b) => `${b.id} (${b.type})`).join(", ") || "(aucun bloc)";
    throw new Error(`Bloc introuvable : ${blockId}. Blocs de cette quotation : ${known}`);
  }
  return index;
}

/** Field-tested warnings attached to write results. */
export function blockWarnings(block) {
  const warnings = [];
  if (block.type === "html") {
    const code = block.data?.code || "";
    if (!code.includes("autoResize")) {
      warnings.push(
        "⚠️ Bloc html sans DuoDeal.autoResize() : l'iframe gardera sa hauteur par défaut (espace blanc ou contenu coupé). Terminer le script par DuoDeal.autoResize()."
      );
    }
    if (/style="height:\s*71px"/.test(code)) {
      warnings.push("⚠️ Spacer inter-sections du demo-kit détecté : chaque bloc V2 gère son espacement, le spacer devient une bande blanche.");
    }
  }
  if (block.type === "faq") {
    const items = block.data?.items || [];
    if (items.some((i) => /<[a-z][\s\S]*>/i.test(`${i.question || ""}${i.answer || ""}`))) {
      warnings.push("⚠️ Le bloc faq interpole du TEXTE BRUT ({{ }}, pas de v-html) : le HTML s'affichera littéralement.");
    }
  }
  if (block.type === "pricing") {
    warnings.push(
      `ℹ️ Les lignes de devis se rattachent à ce bloc via blockId="${block.id}" (create/update_quotation_line). Sans blockId elles retombent sur le PREMIER bloc pricing.`
    );
  }
  return warnings;
}

export const blockTools = [
  {
    name: "get_quotation_blocks",
    description:
      "Liste les blocs V2 d'une quotation, résumés par défaut (id, type, titre, taille de data). full=true pour le contenu intégral. Une quotation créée par l'API naît en builderVersion 1, blocks null — le premier écrit la bascule en V2.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        full: { type: "boolean", description: "Défaut : false" },
      },
      required: ["quotationId"],
    },
    write: false,
    handler: async (args, ctx) => {
      const { quotation, blocks } = await readBlocks(ctx, args.quotationId);
      return {
        quotationId: args.quotationId,
        builderVersion: quotation.builderVersion,
        count: blocks.length,
        blocks: args.full ? blocks : blocks.map(summarizeBlock),
      };
    },
  },
  {
    name: "get_quotation_block",
    description: "Récupère UN bloc V2 complet (data intégral) par son id.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        blockId: { type: "string" },
      },
      required: ["quotationId", "blockId"],
    },
    write: false,
    handler: async (args, ctx) => {
      const { blocks } = await readBlocks(ctx, args.quotationId);
      return blocks[findBlock(blocks, args.blockId)];
    },
  },
  {
    name: "add_quotation_block",
    description:
      "Ajoute un bloc V2 à une quotation (relit puis fusionne le tableau existant — jamais d'écrasement). Types : header, contacts, wysiwyg {columns:[html]}, html {code — finir par DuoDeal.autoResize()}, pricing, customfields {fields:[noms]}, legalnotice, faq {items:[{question,answer}] texte brut}, attachments, paymentschedule, pdfviewer, youtube, gallery, accept, signstamp, pagebreak…",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        type: { type: "string", description: `Un des types connus : ${KNOWN_BLOCK_TYPES.join(", ")}` },
        data: { type: "object", description: "Payload data du bloc, selon son type" },
        title: { type: "string" },
        showTitle: { type: "boolean", description: "Défaut : true" },
        visible: { type: "boolean", description: "Défaut : true" },
        layout: { type: "object", description: "Défaut : {columns: 1, rows: 1}" },
        position: { type: "integer", description: "Index d'insertion (défaut : à la fin)" },
      },
      required: ["quotationId", "type"],
    },
    write: true,
    handler: async (args, ctx) => {
      if (!KNOWN_BLOCK_TYPES.includes(args.type)) {
        throw new Error(`Type de bloc inconnu : "${args.type}". Types connus : ${KNOWN_BLOCK_TYPES.join(", ")}`);
      }
      const { blocks } = await readBlocks(ctx, args.quotationId);
      const block = {
        id: uuid(),
        type: args.type,
        version: 1,
        visible: args.visible !== false,
        title: args.title || "",
        showTitle: args.showTitle !== false,
        layout: args.layout || { columns: 1, rows: 1 },
        data: args.data || {},
      };
      const position = args.position ?? blocks.length;
      const next = [...blocks];
      next.splice(Math.max(0, Math.min(position, next.length)), 0, block);
      await writeBlocks(ctx, args.quotationId, next);
      return { added: block.id, type: block.type, position, totalBlocks: next.length, warnings: blockWarnings(block) };
    },
  },
  {
    name: "update_quotation_block",
    description:
      "Modifie un bloc V2 existant. data est FUSIONNÉ clé par clé avec l'existant (replaceData=true pour remplacer entièrement). title/visible/showTitle/layout modifiables aussi.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        blockId: { type: "string" },
        data: { type: "object" },
        replaceData: { type: "boolean" },
        title: { type: "string" },
        showTitle: { type: "boolean" },
        visible: { type: "boolean" },
        layout: { type: "object" },
      },
      required: ["quotationId", "blockId"],
    },
    write: true,
    handler: async (args, ctx) => {
      const { blocks } = await readBlocks(ctx, args.quotationId);
      const i = findBlock(blocks, args.blockId);
      const block = { ...blocks[i] };
      if (args.data) block.data = args.replaceData ? args.data : { ...(block.data || {}), ...args.data };
      if (args.title !== undefined) block.title = args.title;
      if (args.showTitle !== undefined) block.showTitle = args.showTitle;
      if (args.visible !== undefined) block.visible = args.visible;
      if (args.layout !== undefined) block.layout = args.layout;
      const next = [...blocks];
      next[i] = block;
      await writeBlocks(ctx, args.quotationId, next);
      return { updated: block.id, type: block.type, warnings: blockWarnings(block) };
    },
  },
  {
    name: "delete_quotation_block",
    description:
      "Retire un bloc V2 d'une quotation (relit puis réécrit le tableau sans lui). ⚠️ Supprimer un bloc pricing laisse ses lignes orphelines : elles retomberont sur le premier bloc pricing restant.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        blockId: { type: "string" },
      },
      required: ["quotationId", "blockId"],
    },
    write: true,
    handler: async (args, ctx) => {
      const { blocks } = await readBlocks(ctx, args.quotationId);
      const i = findBlock(blocks, args.blockId);
      const removed = blocks[i];
      const next = blocks.filter((_, idx) => idx !== i);
      await writeBlocks(ctx, args.quotationId, next);
      return { deleted: removed.id, type: removed.type, remainingBlocks: next.length };
    },
  },
  {
    name: "reorder_quotation_blocks",
    description:
      "Réordonne les blocs V2. Fournir la liste COMPLÈTE des ids dans le nouvel ordre (le tool vérifie qu'aucun bloc n'est perdu ni inventé).",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        orderedBlockIds: { type: "array", items: { type: "string" } },
      },
      required: ["quotationId", "orderedBlockIds"],
    },
    write: true,
    handler: async (args, ctx) => {
      const { blocks } = await readBlocks(ctx, args.quotationId);
      const byId = new Map(blocks.map((b) => [b.id, b]));
      const wanted = args.orderedBlockIds;
      const missing = blocks.filter((b) => !wanted.includes(b.id)).map((b) => b.id);
      const unknown = wanted.filter((id) => !byId.has(id));
      if (missing.length || unknown.length) {
        throw new Error(
          `La liste doit couvrir exactement les blocs existants.` +
            (missing.length ? ` Manquants : ${missing.join(", ")}.` : "") +
            (unknown.length ? ` Inconnus : ${unknown.join(", ")}.` : "")
        );
      }
      const next = wanted.map((id) => byId.get(id));
      await writeBlocks(ctx, args.quotationId, next);
      return { reordered: next.map((b) => `${b.type}:${b.id}`) };
    },
  },
  {
    name: "replace_quotation_block_text",
    description:
      "Édition ciblée DANS le data d'un bloc par chemin pointé (ex : \"code\" pour un bloc html, \"columns.0\" pour un wysiwyg). Avec find : remplace la première occurrence de find par replace dans la chaîne visée. Sans find : remplace toute la valeur. Idéal pour retoucher un gros bloc sans le réécrire.",
    inputSchema: {
      type: "object",
      properties: {
        quotationId: { type: "integer" },
        blockId: { type: "string" },
        path: { type: "string", description: 'Chemin dans data, ex "code", "columns.0", "items.2.answer"' },
        find: { type: "string", description: "Sous-chaîne à remplacer (optionnel)" },
        replace: { type: "string" },
        replaceAll: { type: "boolean", description: "true = toutes les occurrences de find" },
      },
      required: ["quotationId", "blockId", "path", "replace"],
    },
    write: true,
    handler: async (args, ctx) => {
      const { blocks } = await readBlocks(ctx, args.quotationId);
      const i = findBlock(blocks, args.blockId);
      const block = structuredClone(blocks[i]);
      const current = getPath(block.data, args.path);
      let next;
      if (args.find !== undefined) {
        if (typeof current !== "string") {
          throw new Error(`data.${args.path} n'est pas une chaîne (${typeof current}) — find/replace impossible.`);
        }
        if (!current.includes(args.find)) {
          throw new Error(`Introuvable dans data.${args.path} : "${args.find.slice(0, 120)}"`);
        }
        next = args.replaceAll ? current.split(args.find).join(args.replace) : current.replace(args.find, args.replace);
      } else {
        next = args.replace;
      }
      setPath(block.data, args.path, next);
      const all = [...blocks];
      all[i] = block;
      await writeBlocks(ctx, args.quotationId, all);
      return {
        updated: block.id,
        path: args.path,
        occurrences: args.find ? (args.replaceAll ? "toutes" : 1) : "valeur entière",
        warnings: blockWarnings(block),
      };
    },
  },
];
