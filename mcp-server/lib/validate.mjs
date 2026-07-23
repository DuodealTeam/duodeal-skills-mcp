// Minimal JSON-Schema-subset validator for tool inputs.
// Supports: type (object/string/number/integer/boolean/array), required,
// enum, minimum/maximum, properties (one level), items.type.
// Returns a list of human-readable problems; empty list = valid.

export function validateInput(schema, args) {
  const problems = [];
  if (!schema || schema.type !== "object") return problems;

  for (const key of schema.required || []) {
    if (args[key] === undefined || args[key] === null || args[key] === "") {
      problems.push(`champ requis manquant : "${key}"`);
    }
  }

  for (const [key, spec] of Object.entries(schema.properties || {})) {
    const value = args[key];
    if (value === undefined || value === null) continue;

    if (spec.type && !typeMatches(spec.type, value)) {
      problems.push(`"${key}" doit être de type ${spec.type} (reçu : ${typeName(value)})`);
      continue;
    }
    if (spec.enum && !spec.enum.includes(value)) {
      problems.push(`"${key}" doit être l'une des valeurs : ${spec.enum.join(" | ")} (reçu : ${JSON.stringify(value)})`);
    }
    if (spec.minimum !== undefined && typeof value === "number" && value < spec.minimum) {
      problems.push(`"${key}" doit être ≥ ${spec.minimum}`);
    }
    if (spec.maximum !== undefined && typeof value === "number" && value > spec.maximum) {
      problems.push(`"${key}" doit être ≤ ${spec.maximum}`);
    }
    if (spec.type === "array" && spec.items?.type) {
      value.forEach((item, i) => {
        if (!typeMatches(spec.items.type, item)) {
          problems.push(`"${key}[${i}]" doit être de type ${spec.items.type}`);
        }
      });
    }
  }
  return problems;
}

function typeMatches(type, value) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    default:
      return true;
  }
}

function typeName(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
