// Resolves the Duodeal connection: API key, base URL, read-only flag.
//
// Precedence (highest wins):
//   1. env DUODEAL_API_KEY              — key inline (discouraged, but supported)
//   2. env DUODEAL_API_KEY_FILE         — path to a file containing the key
//   3. profile from ~/.duodeal/config.json (selected by env DUODEAL_PROFILE,
//      else by "activeProfile" in the file)
//
// The key itself never appears in tool outputs or logs.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const CONFIG_DIR = path.join(os.homedir(), ".duodeal");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const DEFAULT_BASE_URL = "https://api.duodeal.app/api";
const DEFAULT_APP_URL = "https://duodeal.app";

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

function readKeyFile(filePath) {
  const resolved = filePath.startsWith("~")
    ? path.join(os.homedir(), filePath.slice(1))
    : filePath;
  if (!fs.existsSync(resolved)) {
    throw new ConfigError(
      `Fichier de clé introuvable : ${resolved}. Vérifie le chemin (les clés par tenant vivent ` +
        `dans des fichiers comme /Users/felix/Documents/Duodeal/stagein_api_key).`
    );
  }
  const key = fs.readFileSync(resolved, "utf8").trim();
  if (!key) throw new ConfigError(`Le fichier de clé est vide : ${resolved}`);
  return key;
}

export function loadConfigFile() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    throw new ConfigError(`~/.duodeal/config.json est illisible (JSON invalide) : ${err.message}`);
  }
}

export function listProfiles() {
  const file = loadConfigFile();
  if (!file?.profiles) return { activeProfile: null, profiles: [] };
  const active = process.env.DUODEAL_PROFILE || file.activeProfile || null;
  return {
    activeProfile: active,
    profiles: Object.entries(file.profiles).map(([name, p]) => ({
      name,
      active: name === active,
      apiKeyFile: p.apiKeyFile || null,
      hasInlineKey: Boolean(p.apiKey),
      baseUrl: p.baseUrl || DEFAULT_BASE_URL,
      readOnly: Boolean(p.readOnly),
      note: p.note || null,
    })),
  };
}

export function setActiveProfile(name) {
  const file = loadConfigFile();
  if (!file?.profiles?.[name]) {
    const known = Object.keys(file?.profiles || {});
    throw new ConfigError(
      `Profil inconnu : "${name}". Profils disponibles : ${known.length ? known.join(", ") : "(aucun — crée ~/.duodeal/config.json, voir le skill duodeal-mcp-reference)"}`
    );
  }
  if (process.env.DUODEAL_PROFILE) {
    throw new ConfigError(
      `Le profil est verrouillé par la variable d'environnement DUODEAL_PROFILE=${process.env.DUODEAL_PROFILE}. ` +
        `Retire-la de la config MCP pour changer de profil à chaud.`
    );
  }
  file.activeProfile = name;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(file, null, 2) + "\n");
  return name;
}

/**
 * Resolves the effective connection. Re-read on every tool call so profile
 * switches apply without restarting the MCP server.
 */
export function resolveConnection(env = process.env) {
  const base = {
    baseUrl: env.DUODEAL_BASE_URL || DEFAULT_BASE_URL,
    appUrl: env.DUODEAL_APP_URL || DEFAULT_APP_URL,
    readOnly: env.DUODEAL_READ_ONLY === "1" || env.DUODEAL_READ_ONLY === "true",
    profileName: null,
    keySource: null,
  };

  if (env.DUODEAL_API_KEY?.trim()) {
    return { ...base, apiKey: env.DUODEAL_API_KEY.trim(), keySource: "env DUODEAL_API_KEY" };
  }
  if (env.DUODEAL_API_KEY_FILE) {
    return {
      ...base,
      apiKey: readKeyFile(env.DUODEAL_API_KEY_FILE),
      keySource: `fichier ${env.DUODEAL_API_KEY_FILE}`,
    };
  }

  const file = loadConfigFile();
  const profileName = env.DUODEAL_PROFILE || file?.activeProfile;
  if (file?.profiles && profileName) {
    const profile = file.profiles[profileName];
    if (!profile) {
      throw new ConfigError(
        `Le profil actif "${profileName}" n'existe pas dans ~/.duodeal/config.json. ` +
          `Profils disponibles : ${Object.keys(file.profiles).join(", ") || "(aucun)"}`
      );
    }
    const apiKey = profile.apiKey?.trim() || (profile.apiKeyFile ? readKeyFile(profile.apiKeyFile) : null);
    if (!apiKey) {
      throw new ConfigError(
        `Le profil "${profileName}" n'a ni apiKey ni apiKeyFile dans ~/.duodeal/config.json.`
      );
    }
    return {
      ...base,
      apiKey,
      profileName,
      baseUrl: profile.baseUrl || base.baseUrl,
      appUrl: profile.appUrl || base.appUrl,
      readOnly: base.readOnly || Boolean(profile.readOnly),
      keySource: `profil "${profileName}"${profile.apiKeyFile ? ` (fichier ${profile.apiKeyFile})` : ""}`,
    };
  }

  throw new ConfigError(
    "Aucune clé API Duodeal configurée. Trois options :\n" +
      "  1. Créer ~/.duodeal/config.json avec des profils (recommandé, multi-tenant) :\n" +
      '     {"activeProfile": "demo", "profiles": {"demo": {"apiKeyFile": "/chemin/vers/duodeal_api_key"}}}\n' +
      "  2. Variable d'env DUODEAL_API_KEY_FILE=/chemin/vers/le/fichier_de_cle dans la config MCP\n" +
      "  3. Variable d'env DUODEAL_API_KEY=<uuid> (déconseillé : clé en clair dans la config)\n" +
      "Détails : skill « duodeal-mcp-reference »."
  );
}
