// Media upload. Field-tested constraints baked in:
// - POST /medias with fromUrl is UNSTABLE (500 on many CDNs) → never used here;
//   this tool downloads the file itself, then posts base64.
// - files > 4 MB → API 500. No native image lib in Node, so no auto-downscale:
//   the tool fails early with a clear message instead.

const MAX_MEDIA_SIZE_BYTES = 4 * 1024 * 1024;
const MIME_BY_EXT = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", pdf: "application/pdf",
};
const ALLOWED_MIME = new Set([...Object.values(MIME_BY_EXT)]);

function guessMime(url, contentType) {
  if (contentType && ALLOWED_MIME.has(contentType.split(";")[0].trim())) {
    return contentType.split(";")[0].trim();
  }
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  return MIME_BY_EXT[ext] || null;
}

export const mediaTools = [
  {
    name: "upload_media",
    description:
      "Upload d'une image/PDF vers Duodeal (logo, cover, image de ligne). Fournir SOIT url (téléchargée puis encodée en base64 — jamais fromUrl, instable), SOIT base64 (data URI ou brut + mime). Limite API : 4 Mo (au-delà, fournir une image plus légère). MIME : jpeg, png, gif, webp, svg, pdf. Renvoie {id} à référencer ensuite (logo {id}, cover {id}, medias [{id}]).",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL publique de l'image à télécharger" },
        base64: { type: "string", description: "Alternative : contenu en base64 (data URI accepté)" },
        mime: { type: "string", description: "Requis si base64 brut sans data URI" },
        name: { type: "string", description: "Nom du média (défaut : dérivé de l'URL)" },
        folder: { type: "string", description: "Dossier Duodeal (défaut : « agent »)" },
      },
    },
    write: true,
    handler: async (args, ctx) => {
      const folder = args.folder || "agent";
      let dataUri;
      let mime;
      let name = args.name;

      if (args.url) {
        const res = await fetch(args.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh) DuodealPlugin/0.1" },
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) throw new Error(`Téléchargement impossible (${res.status}) : ${args.url}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
          throw new Error(
            `Image trop lourde : ${(buffer.byteLength / 1024 / 1024).toFixed(1)} Mo (limite API : 4 Mo). ` +
              "Utiliser une version plus légère ou redimensionner avant upload."
          );
        }
        mime = args.mime || guessMime(args.url, res.headers.get("content-type"));
        if (!mime) throw new Error("MIME indéterminable — le préciser via le paramètre mime.");
        dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
        name = name || decodeURIComponent(args.url.split("?")[0].split("/").pop() || "media");
      } else if (args.base64) {
        const match = args.base64.match(/^data:([^;]+);base64,(.+)$/s);
        mime = match ? match[1] : args.mime;
        const raw = match ? match[2] : args.base64;
        if (!mime) throw new Error("base64 brut fourni sans mime — préciser le paramètre mime.");
        const bytes = Buffer.from(raw, "base64").byteLength;
        if (bytes > MAX_MEDIA_SIZE_BYTES) {
          throw new Error(`Contenu trop lourd : ${(bytes / 1024 / 1024).toFixed(1)} Mo (limite API : 4 Mo).`);
        }
        dataUri = match ? args.base64 : `data:${mime};base64,${args.base64}`;
        name = name || "media";
      } else {
        throw new Error("Fournir url OU base64.");
      }

      if (!ALLOWED_MIME.has(mime)) {
        throw new Error(`MIME non supporté : ${mime}. Acceptés : ${[...ALLOWED_MIME].join(", ")}`);
      }
      return ctx.api.post("/medias", { name, mime, folder, file: dataUri });
    },
  },
];
