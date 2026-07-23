import { asList } from "../lib/http.mjs";
import { redactSecrets } from "../lib/util.mjs";

export const userTools = [
  {
    name: "get_me",
    description:
      "Profil du compte lié à la clé API active + sa company (tenant). La clé API présente dans la réponse est masquée — elle ne doit jamais apparaître en clair.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => redactSecrets(await ctx.api.get("/users/me")),
  },
  {
    name: "list_users",
    description: "Liste les users (« sales ») de la company du tenant actif.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => redactSecrets(asList(await ctx.api.get("/users"))),
  },
  {
    name: "create_user",
    description:
      "Crée un user dans la company (droits admin requis sur la clé). Utile pour créer un expéditeur dédié par démo. ⚠️ Un user propriétaire de deals ne peut pas être supprimé ensuite (le désactiver : active=false).",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string", description: "Mot de passe initial (généré côté appelant)" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        jobTitle: { type: "string" },
        language: { type: "string", enum: ["fr", "en"] },
      },
      required: ["email", "password"],
    },
    write: true,
    handler: async (args, ctx) => {
      const created = await ctx.api.post("/users", {
        email: args.email,
        password: args.password,
        ...(args.firstName ? { firstName: args.firstName } : {}),
        ...(args.lastName ? { lastName: args.lastName } : {}),
        ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
        ...(args.language ? { language: args.language } : {}),
      });
      return redactSecrets(created);
    },
  },
];
