import { listProfiles, setActiveProfile, CONFIG_PATH } from "../lib/config.mjs";
import { redactSecrets } from "../lib/util.mjs";

export const connectionTools = [
  {
    name: "connection_status",
    description:
      "Vérifie la connexion Duodeal active : profil, source de la clé (jamais la clé elle-même), tenant (company) via GET /users/me. À appeler en premier en cas de doute sur « quel compte est branché ».",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async (_args, ctx) => {
      const conn = ctx.getConnection();
      const me = await ctx.api.get("/users/me");
      return {
        profile: conn.profileName || "(aucun — clé via variable d'environnement)",
        keySource: conn.keySource,
        baseUrl: conn.baseUrl,
        readOnly: conn.readOnly,
        user: redactSecrets({
          id: me?.id,
          email: me?.email,
          fullName: [me?.firstName, me?.lastName].filter(Boolean).join(" "),
          company: { id: me?.company?.id, name: me?.company?.name },
        }),
        rappel: "Écritures réservées aux comptes de test/démo, jamais un tenant client réel sans demande explicite.",
      };
    },
  },
  {
    name: "list_profiles",
    description:
      "Liste les profils de connexion Duodeal déclarés dans ~/.duodeal/config.json (multi-tenant : demo, stagein, noura, hubspot…). Indique le profil actif. Ne révèle jamais les clés.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    handler: async () => {
      const result = listProfiles();
      if (!result.profiles.length) {
        return {
          activeProfile: null,
          profiles: [],
          aide: `Aucun profil. Créer ${CONFIG_PATH} — modèle dans le skill « duodeal-mcp-reference ».`,
        };
      }
      return result;
    },
  },
  {
    name: "use_profile",
    description:
      "Bascule le profil de connexion actif (écrit activeProfile dans ~/.duodeal/config.json). Prend effet immédiatement, sans redémarrer le serveur. Vérifier ensuite avec connection_status.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du profil tel que listé par list_profiles" },
      },
      required: ["name"],
    },
    write: false, // touches local config only, never the API
    handler: async (args) => {
      const name = setActiveProfile(args.name);
      return { activeProfile: name, note: "Profil basculé. Lancer connection_status pour confirmer le tenant." };
    },
  },
];
