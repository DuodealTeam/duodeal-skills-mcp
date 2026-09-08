---
name: duodeal-hubspot-crm
description: How Duodeal runs its OWN sales CRM in HubSpot (portal 146999082) — lifecycle stage, the two deal pipelines, the "1 demo = 1 deal" rule, which properties to fill, how to log a note, and the live property values (not the meeting-notes version). Use whenever the user asks to create or update a HubSpot contact/company/deal for a Duodeal prospect or client, after building or sending a Duodeal proposal (always PROPOSE a HubSpot sync at that point), or when the user mentions HubSpot, CRM hygiene, lifecycle stage, deal pipeline, lead status, or "portal 146999082". This is about Duodeal's own commercial pipeline (Duodeal selling to its prospects) — unrelated to the other skills in this package, which help a Duodeal CLIENT set up and use their own Duodeal account.
---

# Duodeal's own HubSpot CRM

This skill is about the CRM Duodeal's own sales team works in every day (portal
**146999082**) — not a client's Duodeal account. Use the HubSpot connector's tools
(`search_crm_objects`, `get_crm_objects`, `manage_crm_objects`, `search_properties`,
`get_properties`, `search_owners`, `query_crm_data`) to read and write it.

## Ground truth over meeting notes

Duodeal's HubSpot has been reshaped a few times (July–September 2026 rebuild with Romain
Kerbois, an intern). Notion still holds the planning meetings for that rebuild, and their
proposed nomenclature does **not** always match what actually shipped. **Always confirm the
live property definition with `get_properties`/`search_properties` before trusting a name,
a label or an option value read from a doc, a memory, or your own training** — including
this file after a few months. Two concrete traps, found live on 2026-09-08:

- **A property's internal VALUE and its display LABEL can differ, deliberately.**
  `lifecyclestage` on contacts/companies still uses HubSpot's five built-in enum keys
  (`lead`, `marketingqualifiedlead`, `salesqualifiedlead`, `opportunity`, `customer`, plus
  `other`) as the *values*, but the portal has **relabeled** them and added custom stages:

  | value (what the API returns/expects) | label (what the team calls it) |
  |---|---|
  | `lead` | New Lead |
  | `salesqualifiedlead` | In Process |
  | `marketingqualifiedlead` | Qualified Lead |
  | `5709332728` | Nurturing |
  | `5709333690` | Not Interested |
  | `opportunity` | Opportunity |
  | `4932433137` | Deal lost |
  | `customer` | Customer |
  | `5771750611` | Churn |
  | `other` | Not a Lead |
  | `5777464516` | Don't Contact |

  This is the July 2026 "merge lead status into lifecycle stage" decision, actually
  implemented — but by repurposing HubSpot's stock lifecycle-stage keys rather than
  creating a parallel custom pipeline, so a raw value like `salesqualifiedlead` reads as
  "Sales Qualified Lead" to anyone who doesn't check the label. **Never infer meaning from
  the enum value alone; always fetch the label through `get_properties`.**
- **The separate `hs_lead_status` field was supposed to be retired** (decision logged
  28 Jul 2026, "use only Lifecycle Stage") **but is still live and still gets set**
  (values: New, In Process, Nurturing, Qualified, Don't Contact — a near-duplicate of the
  lifecycle-stage labels above). Treat `lifecyclestage` as the one authoritative field;
  don't be surprised to see `hs_lead_status` populated too, and don't invest effort
  reconciling the two — that cleanup is still open, not a bug in your read.
- **`hs_tcv` (Total contract value) is a calculated, read-only property.** Do not try to
  set it — the write fails, and if it's bundled with other property changes in the same
  `manage_crm_objects` call, the WHOLE object update for that record fails (the other
  objects in the same call are unaffected). Update it indirectly (line items / deal type)
  if it matters, or just leave it and put the number in `amount` and the deal description.
- No dedicated "Offer type" property exists on deals despite being discussed in a July
  planning meeting — don't assume it was created; `search_properties` first.
- There may be more than one similarly-named "lost reason" property
  (`closed_lost_reason` vs `closedlost_reason` turned up together in one portal). Check
  with `search_properties` before writing either rather than guessing which is live.

## The model: Lead → Deal → Customer

1. **Lead** — a contact (and its company) exists with no deal yet: inbound form, manual
   entry, or the AI agent. `lifecyclestage` starts at "New Lead" the moment a contact
   lands, regardless of source.
2. **Deal** — created **manually**, one per **qualified opportunity**, not per contact and
   not per touchpoint. **Rule: 1 demo = 1 deal.** A deal is created when a meeting/demo is
   booked (a booked demo implies an active opportunity); never before that, never a second
   deal for a second conversation on the same opportunity — update the existing deal
   instead. `lifecyclestage` on the contact(s) and company moves to "Opportunity" at that
   point (this can be manual or workflow-driven; check rather than assume).
3. **Customer** — `lifecyclestage` moves to "Customer" when the deal is won. A renewal date
   is required at that point (see below) and the record moves into the CSM pipeline.

Deal creation is intentionally manual and lightly automated on stage transitions —
forecast accuracy is trusted to the rep's judgment, not to a workflow guessing at intent.

## Deal pipelines (confirmed live, `pipeline` property)

| internal value | label | used for |
|---|---|---|
| `default` | **New Business** | prospects without an existing licence |
| `3956036799` | **Pipe CSM** | existing clients (renewals) |

New Business `dealstage` values (confirmed live): `appointmentscheduled` = Demo booked,
`qualifiedtobuy` = Cold deal, `decisionmakerboughtin` = Hot deal, `contractsent` = Verbal
agreement, `closedwon` = Deal won, `closedlost` = Deal Lost. Pipe CSM carries its own stage
set (Customer, Renewal, Proposal sent, Renewed, Churn, seen as numeric IDs) — confirm with
`get_properties` on `dealstage` before writing to a CSM-pipe deal; don't reuse the
New-Business stage values there.

- **Closed Lost requires a loss reason** — don't close a deal lost without filling one
  (competition, ghosting, status quo, bad timing, etc. — see the property caveat above).
- **Closed Won requires a renewal date** (`renewal_date`) — it drives a task for the
  contact owner 3 months before renewal. Fill it the moment a deal is won, not later.

## What to fill when you touch a Duodeal prospect/client

**On the deal:**
- `dealname` — `<Company> - <what/how many seats>` (e.g. "Stephens Rickard - 5 Growth seats").
- `amount` + `deal_currency_code` — the actual signable total, in the CLIENT'S currency,
  matching the live Duodeal quotation (not a stale earlier pricing round — see the caution
  below).
- `pipeline` + `dealstage`, `dealtype` (`newbusiness`/`existingbusiness`), `hs_priority`
  (`low`/`medium`/`high` — high for large or fast-moving deals), `closedate` (the
  proposal's validity date, or the expected close), `hubspot_owner_id` (the rep who owns
  the relationship, not a generic account).
- `description` — a running narrative kept CURRENT: who the prospect is, what they told
  you, the pricing breakdown with its date, the Duodeal client + editor links, the key
  dates (leave, onboarding timing), and a `NEXT:` line with the next step and its date.
  **Every time the price changes, update this field** — do not leave an old total sitting
  next to a corrected one; a stale number here reads as fact to the next person who opens
  the record. Same for the deal's Duodeal quotation link if it changes.

**On the contact(s):** `jobtitle`, `lifecyclestage`, `hubspot_owner_id`, and `next_step`
kept current the same way (a stale price or a "proposal prepared" that should now say
"proposal sent" is the single most common drift found in this CRM).

**On the company:** `description` (industry, size, HQ, what they use today, the current
proposal state), `industry`, `numberofemployees`, `domain`/`website`. The Company object
was historically under-used at Duodeal; associate every deal's contacts to a company
record anyway — it's the natural home for account-level context across multiple deals.

**Ownership**: nothing goes unowned. If a contact, company or deal has no
`hubspot_owner_id`, assign one (`search_owners` to resolve a name to an `ownerId`) rather
than leaving it blank.

## Logging activity: use a note, associate it to everything relevant

A HubSpot **note** (`objectType: "notes"`, property `hs_note_body`, plus `hs_timestamp`)
can be associated with the deal, both contacts and the company in **one**
`manage_crm_objects` `createRequest` call — do that rather than writing four separate,
slightly different summaries. Log:
- The demo/call itself: what the prospect said, their questions, first impressions.
- Any pricing correction or material change, with the reason (so a future reader
  understands why the number moved, not just that it did).
- The actual send: date and time the proposal left, and to whom.

Don't rewrite an existing note's body to "fix" it after the fact if it was accurate when
written (e.g. a demo-call summary that quoted the pricing decided that day) — that erases
the trail. Add a new note that supersedes it instead, and update the deal/contact/company
`description`/`next_step` fields (which represent current state, not history) to match.

## Before writing: confirm, then write

Every create or update on a live prospect's record needs the confirmation table required
by `manage_crm_objects` itself (current value → proposed value, per property) — this is
the tool's own contract, not optional. Skip the confirmation prompt only when the user has
explicitly asked you to fill in specific values and there is no live/current data those
values could be conflicting with; still name what you're about to write.

## Cross-reference with Duodeal's own proposal-building work

**Whenever a Duodeal proposal is built, repriced or sent for a real prospect or client
(the internal proposal workflow, not a client's own Duodeal account), PROPOSE syncing
HubSpot using this skill** — check whether a contact/company/deal already exists for
that prospect (`search_crm_objects` by domain or company name), and if so whether its
`amount`, `description`/`next_step` and stage are still accurate; if not, offer the diff
before writing. If no HubSpot deal exists yet for the demo behind that proposal, propose
creating one (remember: 1 demo = 1 deal, in the New Business pipeline). Don't write
without naming the diff first, per the confirmation rule above.

## The HubSpot → Duodeal direction (the other tool)

There is also a HubSpot app that goes the other way: **"Generate the Duodeal quote"** on a
Deal card, creates a Duodeal quotation from that deal's contact + line items + company (and
optionally AI-written editorial text in the rep's learned style — it never touches price,
product or structure). Install link (admin only, once per portal):
`https://duodeal-hubspot-h6rsu.ondigitalocean.app/oauth/install`. Mention it when a rep
wants to start a Duodeal quote FROM an existing HubSpot deal rather than the reverse.
