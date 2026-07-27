---
name: duodeal-mcp-best-practices
description: Règles d'or, contrat de rendu et check-list pour générer, modifier ou livrer un devis Duodeal (selling page HTML) via le connecteur MCP officiel. Utiliser avant de générer, modifier ou livrer un devis Duodeal, ou quand on parle de « bonnes pratiques », « règles d'or », « check-list devis », « contrat de rendu » ou « selling page ». Couvre la structure des blocs natifs, les blocs HTML qui survivent à l'éditeur visuel et au PDF, les prix et devises, le contenu/copie, et les garde-fous d'écriture API.
---

# Bonnes pratiques — devis Duodeal (via le MCP)

Ces règles s'appliquent dès que tu génères, modifies ou livres un devis via le connecteur MCP Duodeal officiel. Le contexte du client est déjà connu : applique-les directement, sans recherche préalable. Pour le savoir-faire détaillé, voir aussi **duodeal-quote-building**, **duodeal-quote-design** et **duodeal-v2-blocks**.

## Check-list bloquante (avant toute livraison)

Un point en échec = devis à refaire.

1. **Header natif rempli** avec logo + cover de l'émetteur, jamais masqué ni recodé en HTML.
2. **Bloc contacts natif présent**, émetteur (owner dédié et nommé) ET destinataire renseignés.
3. **Chaque bloc porte un `title` non vide** (sinon l'interface affiche « html » à la place du titre).
4. **Chaque ligne produit a une image** carrée centrée, attachée aux médias de la LIGNE (pas du produit lié).
5. **Chaque bloc HTML se termine par `DuoDeal.autoResize()`** et reste présentable une fois ses `<style>` retirés (tout en style inline, aucun `<script>` séparé).
6. **`builderVersion` 2 active**, langue et devise posées au niveau du deal, sans toucher aux réglages du compte.
7. **Aucun placeholder `{{...}}` ni tiret cadratin restant**, rendu vérifié sur la vue client + export PDF réels (pas la seule lecture du code).

## Structure du devis et blocs natifs (contrat de rendu)

Les blocs natifs portent l'identité de l'émetteur, la signature et les mentions légales : garde-les remplis et bien renseignés.

- ⚠️ **Header natif** : logo + cover de l'émetteur, jamais vide ni recodé en HTML (le vider ou le refaire casse le rendu et impose une refonte).
- ⚠️ **Bloc contacts natif** (émetteur + destinataire), jamais recréé en HTML ; vérifier la présence du destinataire (sinon info désynchronisée, livraison non conforme).
- Donner un `title` non vide à chaque bloc ; si le titre visible vit dans le HTML, garder le `title` et poser `showTitle:false`.
- Image sur chaque ligne produit, sur les médias de la LIGNE, carrée, centrée sur le sujet (`object-fit: cover`).
- Logos cohérents (même format, fond, taille) sur tous les devis d'un même compte.
- Owner du deal = utilisateur émetteur dédié et nommé (personne + fonction) avec sa vraie photo, jamais la société ni un compte générique.
- Choisir pour l'owner une adresse de login plausible : la carte émetteur affiche l'email de LOGIN.
- Poser langue et devise au niveau du deal (per-deal), sans toucher au compte.
- Regrouper mentions légales et CGV dans le bloc `legalnotice` natif, une seule fois, tous les champs structurés renseignés (au minimum le nom de la société émettrice) ; ⚠️ un champ vide retombe sur le nom du COMPTE.
- Unique CTA = bouton natif « Accepter et signer » ; ⚠️ jamais de faux bouton HTML (ne déclenche pas la signature).
- Passer tout devis en `builderVersion` 2 dès sa création.
- Structurer en blocs dédiés (un sujet = un bloc), en privilégiant les blocs natifs (header, contacts, pricing, legalnotice, attachments).
- Identité visuelle cohérente : une police de référence, une palette fixe à rôles définis (fond, accent, primaire, contraste).

## Blocs HTML : survivre à l'éditeur visuel et au PDF

⚠️ L'éditeur visuel supprime les `<style>` et neutralise les `<script>` à la première édition du commercial ; le rendu final passe aussi par un export PDF. Chaque bloc doit tenir dans ces deux états.

- Tout le style en inline (`style="..."`) ; aucun `<style>` sauf `@font-face`, aucun `<script>` séparé (interactivité en `onclick` inline).
- Responsive sans media query : `flex` + `flex-wrap` + `flex:1 1 basis` (jamais `grid-template-columns`), repli une colonne sur écran étroit et à l'impression.
- Vérifier avant livraison que chaque bloc reste présentable une fois ses `<style>` retirés : c'est l'état que verra le prospect.
- Terminer chaque bloc par `DuoDeal.autoResize()` dans un `try/catch` ; ⚠️ sinon l'iframe garde une hauteur figée et coupe le bas.
- Police de marque en `@font-face` base64 inline + fallback système lisible ; jamais de `<link>` CDN ni de police externe (bloquée par CORS ou absente au PDF).
- Images/logos dans la médiathèque Duodeal, `max-width:100%; height:auto` ; jamais de hotlink externe.
- `box-sizing:border-box` sur tout élément dimensionné ; ⚠️ son absence est la cause n°1 des débordements mobile (`width:100%` + padding).
- `break-inside:avoid` (+ `page-break-inside:avoid`) sur cartes, étapes, panneaux, CTA ; emballer kicker + titre + contenu dans un même conteneur ; ⚠️ le moteur PDF n'honore pas `break-after:avoid`.
- Hauteur déterminée par le contenu : pas de `height` fixe, pas de `vh`, pas de saut de page forcé.
- ⚠️ Aucun scroller interne (`max-height` + `overflow-y:auto`) : l'auto-dimensionnement injecte des milliers de pixels de blanc en client/PDF, invisible dans l'éditeur.
- Un override d'impression pour chaque media query mobile ; plafonner les spacers en mobile et restaurer la valeur desktop à l'impression.
- Spacers cohérents en tête (et en bas) de chaque bloc de section, sauf le cover/intro qui suit le header ; un spacer avant le tableau de prix.
- Namespacer toutes les classes CSS avec un préfixe court propre au bloc (évite les collisions entre blocs d'une même page).
- Pictogrammes en SVG inline (pas de glyphes unicode exotiques → tofu), pas de texte en dégradé (`background-clip:text` → filet parasite), pas de `box-shadow` sur les blocs critiques (préférer une bordure 1px, meilleur rendu PDF).
- ⚠️ Pas de bloc FAQ natif : il rend le HTML littéralement (les entités s'affichent telles quelles). Construire la FAQ en bloc HTML.
- Carte flex texte + média : `min-width:0` sur la colonne texte, `overflow-wrap:anywhere` sur mots/emails longs, empiler en colonne sur écran étroit.
- Plafonner les images larges en mobile via `width`/`max-width`, jamais `transform:scale` (ne réduit pas la largeur de layout).
- Table à largeur minimale incompressible dans un conteneur `overflow-x:auto`, ou la faire tenir sous ~360 px.
- Covers/full-bleed en `width:100%` et `border-radius:0`, validés contre la vue client (pas la carte de l'éditeur, qui a un rayon et un clip absents côté client).
- Capture portrait dans un cadre paysage : `object-fit:contain` sur fond blanc, jamais `cover` (qui recadre et zoome).
- Vidéo : vérifier l'embed autorisé, poster brandé opaque sur un iframe `about:blank`, injecter l'URL d'embed (autoplay, playsinline) au clic sur le poster.

## Prix, totaux et devises

Le tableau natif n'expose qu'UN total et la plateforme peut rescaler les montants via un change-rate.

- ⚠️ Montants récurrents (abonnements) dans un bloc HTML de récap, jamais dans le tableau natif ; un seul total par devis (sinon total absurde).
- Ne pas compter sur le flag « option » pour sortir un montant obligatoire du total (il affiche un badge « Option non incluse » inadapté).
- Devise étrangère via le formatage cosmétique du deal (`displayCurrencyFormat` : symbole, position, séparateurs), sans changer la vraie devise ; saisir les montants nativement dans la devise cible.
- ⚠️ Deal en devise différente du compte : éditer les montants ligne par ligne (jamais de PUT global), garder les totaux STATIQUES dans les blocs HTML sans lire le montant renvoyé par l'API, re-vérifier après chaque écriture — le change-rate rescale silencieusement.

## Contenu et copie

- ⚠️ Jamais de tiret cadratin « — » nulle part (le serveur tronque un `productTitle` au tiret cadratin) ; préférer « : », « ; », « · » ou la virgule.
- Vrais fichiers de logo (SVG/PNG officiels), jamais un nom de marque tapé en texte stylisé ; ne pas l'étirer, le déformer, le recolorer ni le faire pivoter.
- Vraie photo du commercial (portrait carré centré sur le visage) dans la carte émetteur ; monogramme d'initiales en dernier recours, jamais un visage fabriqué.
- Aucun placeholder `{{...}}` ni contenu générique non remplacé sur la page client.
- ⚠️ Caractères accentués en UTF-8 littéral partout ; jamais d'entités HTML dans un champ texte brut (un `&eacute;` s'affiche littéralement).
- Descriptions de ligne du tableau natif : apostrophe courbe, pas droite (le PDF ne dessine pas l'apostrophe droite).
- Image de cover utilisée une seule fois ; pas de réemploi en galerie ou en ligne produit.
- Une seule couleur d'accent réservée aux détails ; uniquement les couleurs et polices du design system validé.
- Pas de légendes de type disclaimer sous les images (alourdit et déprécie le rendu premium).

## Garde-fous process et écritures API

L'état serveur fait foi ; les écritures sont partielles ou destructrices.

- ⚠️ Toujours un deal NEUF et une quotation NEUVE ; ne jamais modifier, supprimer, archiver ni cloner un deal, devis, utilisateur ou média existant. Une refonte s'isole sur un nouveau deal, l'ancienne version reste intacte.
- Ne jamais écraser les réglages globaux du compte (nom, devise, logo, bannière) : toute la personnalisation dans le deal neuf (le compte est partagé entre émetteurs et devis).
- Faire valider le design (structure, données, couleurs, police, ton) par l'humain AVANT de générer le moindre HTML.
- État serveur (JSON de la quotation) = seule source de vérité : le relire avant toute édition, re-vérifier après chaque écriture.
- Éditions chirurgicales bloc par bloc (remplacement de texte ciblé, PUT ligne par ligne) ; ⚠️ jamais réécrire le tableau `blocks` complet à l'aveugle (efface les éditions manuelles du commercial) — relire et fusionner.
- Mise à jour de bloc : renvoyer l'objet `data` COMPLET (merge shallow) ; `customFields` : relire puis renvoyer toutes les sections (l'envoi remplace tout l'objet).
- Remplacement de texte ciblé sans cible trouvée (0 remplacement) = conflit : relire l'état serveur et repartir de la version serveur, jamais forcer.
- ⚠️ Ne jamais laisser un onglet éditeur Duodeal ouvert sur le deal pendant les écritures API : l'auto-save réécrit avec sa copie mémoire et annule le travail fait par API.
- Avant toute écriture, vérifier que le connecteur est connecté au compte cible (`get_current_user`) ; un 403 sur un deal connu signale une connexion au mauvais compte, pas un rate-limit.
- Ne pas lire brute une réponse `get_quotation` volumineuse (~80 Ko) : la sauvegarder puis la parser.
- Ne jamais exposer les identifiants de connexion (clé API, token) : ni affichés, ni loggés.
- Valider un bloc seulement après un rendu réel (export PDF + vue web live) et un test de chaque bloc isolé à une largeur mobile réelle, jamais sur la seule lecture du code.
- Si un bloc HTML interactif fait sortir des données hors de la plateforme, le signaler ; ne jamais présenter l'hébergement, la conformité ou une validation « temps réel » comme opérationnels sur la page client (les validations de démo ne sont que des contrôles de format).
