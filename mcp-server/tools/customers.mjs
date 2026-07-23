import { filterParams } from "./deals.mjs";

export const customerTools = [
  {
    name: "list_customers",
    description:
      'Liste les contacts (customers) du tenant, paginé + filtres (ex {"email": {"endsWith": "@acme.com"}}, {"customerCompany.name": {"contains": "Acme"}}).',
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        itemsPerPage: { type: "integer", minimum: 1, maximum: 100 },
        filters: { type: "object" },
        all: { type: "boolean" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = { page: args.page, itemsPerPage: args.itemsPerPage, ...filterParams(args.filters) };
      if (args.all) {
        const items = await ctx.api.listAll("/customers", query);
        return { count: items.length, customers: items };
      }
      const resp = await ctx.api.get("/customers", query);
      return Array.isArray(resp) ? { count: resp.length, customers: resp } : resp;
    },
  },
  {
    name: "create_customer",
    description:
      "Crée un contact. Tout est optionnel (number auto-généré) mais recommandé : firstName, lastName, email, customerCompanyId. deliveryAddress requis si differentDeliveryAddress=true.",
    inputSchema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        jobTitle: { type: "string" },
        civility: { type: "string" },
        customerCompanyId: { type: "integer" },
        payload: {
          type: "object",
          description: "Champs supplémentaires API : billingAddress {country, address, postCode, city}, differentDeliveryAddress, deliveryAddress, customFields",
        },
      },
    },
    write: true,
    handler: async (args, ctx) => {
      const body = {
        ...(args.payload || {}),
        ...(args.firstName ? { firstName: args.firstName } : {}),
        ...(args.lastName ? { lastName: args.lastName } : {}),
        ...(args.email ? { email: args.email } : {}),
        ...(args.phone ? { phone: args.phone } : {}),
        ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
        ...(args.civility ? { civility: args.civility } : {}),
        ...(args.customerCompanyId ? { customerCompany: { id: args.customerCompanyId } } : {}),
      };
      return ctx.api.post("/customers", body);
    },
  },
  {
    name: "update_customer",
    description:
      "Met à jour un contact. customerCompanyId: 0 explicite = délier de son entreprise (envoie null). DELETE impossible si le contact a des deals (archiver à la place : archived=true).",
    inputSchema: {
      type: "object",
      properties: {
        customerId: { type: "integer" },
        payload: { type: "object", description: "Champs API à modifier (firstName, email, archived…)" },
        customerCompanyId: { type: "integer", description: "0 = délier" },
      },
      required: ["customerId"],
    },
    write: true,
    handler: async (args, ctx) => {
      const body = { ...(args.payload || {}) };
      if (args.customerCompanyId !== undefined) {
        body.customerCompany = args.customerCompanyId === 0 ? null : { id: args.customerCompanyId };
      }
      return ctx.api.put(`/customers/${args.customerId}`, body);
    },
  },
  {
    name: "list_customer_companies",
    description: "Liste les entreprises clientes (customer-companies), paginé + filtres.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1 },
        itemsPerPage: { type: "integer", minimum: 1, maximum: 100 },
        filters: { type: "object", description: 'Ex {"name": {"contains": "Acme"}}' },
        all: { type: "boolean" },
      },
    },
    write: false,
    handler: async (args, ctx) => {
      const query = { page: args.page, itemsPerPage: args.itemsPerPage, ...filterParams(args.filters) };
      if (args.all) {
        const items = await ctx.api.listAll("/customer-companies", query);
        return { count: items.length, customerCompanies: items };
      }
      const resp = await ctx.api.get("/customer-companies", query);
      return Array.isArray(resp) ? { count: resp.length, customerCompanies: resp } : resp;
    },
  },
  {
    name: "create_customer_company",
    description: "Crée une entreprise cliente. Seul name est requis. Opt : siret, vatNumber, tradeName, address {country, address, postCode, city}, customFields.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        payload: { type: "object", description: "Champs optionnels API" },
      },
      required: ["name"],
    },
    write: true,
    handler: async (args, ctx) => ctx.api.post("/customer-companies", { name: args.name, ...(args.payload || {}) }),
  },
];
