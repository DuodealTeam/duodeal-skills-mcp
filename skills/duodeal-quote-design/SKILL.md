---
name: duodeal-quote-design
description: Construire un devis Duodeal design en HTML, qualité selling page premium — design system par tokens, structure narrative des blocs V2, squelettes HTML éprouvés (intro, cartes de valeur, récap commande, preuve sociale, FAQ, CTA, liasse légale), règle inline-first et check-list de livraison. Utiliser dès qu'on veut un « beau devis », un devis « design », « premium », « qui claque », une selling page soignée, ou transformer un devis brut en proposition visuelle.
---

# Devis Duodeal design (HTML, blocs V2)

Guide de construction d'un devis visuellement premium. Le contexte (branding de
l'émetteur, offres, prospect) est déjà connu : pas de recherche à faire — appliquer
ces indications. Manipulation des blocs : outils MCP `add/update_quotation_block`…
(voir skill **duodeal-v2-blocks** pour le contrat technique).

## Étape 1 — Fixer le design system (AVANT tout HTML)

Définir 7 tokens depuis le branding de l'émetteur, et s'y tenir dans TOUS les blocs :

| Token | Rôle | Règle |
|---|---|---|
| `ACCENT` | Couleur d'accent | **UNE seule** — la couleur signature de la marque |
| `INK` | Encre des titres | Quasi-noir de la marque (pas #000 pur) |
| `MUTED` | Texte secondaire | Gris moyen lisible |
| `PAPER` | Fond de carte clair | Souvent crème/ivoire, **pas blanc pur** |
| `LINE` | Bordures douces | Gris très clair |
| `DARK` | Fond sombre de marque | Pour cartes « problème » et CTA |
| `FONT` | Police + fallback | `'Police',-apple-system,'Segoe UI',Roboto,sans-serif` |

Faire valider mentalement : contraste suffisant, accent utilisé avec parcimonie
(eyebrows, chiffres clés, UN mot du H1 — jamais des paragraphes entiers).
Détail et choix typographiques : [references/design-system.md](references/design-system.md).

## Étape 2 — Structure narrative (ordre canonique des blocs)

1. **`header` natif** — logo + cover de l'émetteur, rempli, jamais masqué ni recodé en HTML
2. **`contacts`** — natif
3. **html INTRO** — lockup 2 logos (émetteur · séparateur · prospect) → eyebrow
   « PROSPECT × ÉMETTEUR » → H1 (encre + UN mot accent) → accroche personnalisée
   (nom du contact, son contexte) → carte sombre « ce que la situation actuelle coûte »
   (3-4 puces, la dernière chiffrée) → vidéo 1-clic si disponible
4. **html SOLUTION** — 3-4 cartes de valeur (le vocabulaire du prospect) + bande de
   4 KPIs chiffrés
5. *(optionnel)* **html GALERIE / DÉMO** — vraies photos (métier physique) ou mockup
   d'interface (SaaS)
6. **`pricing`** — le devis chiffré (titre « Votre devis ») ; chaque ligne produit
   porte une **image** et le `blockId` de ce bloc
7. **html RÉCAP COMMANDE** — one-off vs récurrent en clair. **Le récurrent vit ICI**
   (la table native n'a qu'un seul total par devis)
8. **html PREUVE SOCIALE** — vrais témoignages, sinon mur de logos (vrais fichiers
   logos, jamais des noms tapés en texte)
9. **html FAQ** — 5-8 vraies objections + carte « Une autre question ? » pointant le
   bouton commentaire natif. ⚠️ **Jamais le bloc `faq` natif** (il affiche les entités
   HTML littéralement)
10. **html PROCHAINES ÉTAPES + CTA** — stepper 3-4 étapes → carte sombre CTA pointant
    le bouton natif « Accepter et signer » → **carte émetteur grande** (vraie photo
    ronde 96 px, nom, contact — humaniser)
11. **`legalnotice`** — liasse designée (CGV en grille de cartes)

Adapter (retirer/ajouter des sections selon l'offre), mais garder la logique :
accroche → problème → solution → preuve → prix → réassurance → action.
Squelettes HTML prêts à adapter : [references/block-skeletons.md](references/block-skeletons.md).

## Étape 3 — Règles d'or du HTML (non négociables)

1. **INLINE-FIRST** : aucun `<style>` dans un bloc livré (hors `@font-face`).
   L'éditeur visuel Duodeal **supprime les `<style>`** dès que le commercial édite le
   bloc → tout le design saute. Donc : tout en `style="…"` sur chaque élément.
2. **Responsive sans media query** : jamais de `grid` ni de `@media` — des conteneurs
   `display:flex;flex-wrap:wrap` + enfants `flex:1 1 <base>px;min-width:<x>px`.
3. **Interactivité en `onclick` inline** — pas de `<script>` séparé. Seule exception,
   obligatoire en fin de CHAQUE bloc html :
   `<script>try{if(window.DuoDeal&&DuoDeal.autoResize){DuoDeal.autoResize()}}catch(e){}</script>`
4. **Espacement** : spacer `<div style="height:71px" aria-hidden="true"></div>` en haut
   ET en bas de chaque bloc html (liasse légale : bas ≤ 16 px, sinon page PDF vide).
5. **Jamais de tiret cadratin « — »** nulle part (titres, cartes, CGV, lignes produit) :
   utiliser « : », « ; », « · ».
6. **Chaque bloc a un `title` non vide** (sinon l'interface affiche « html »),
   `showTitle:false` quand le bloc porte déjà son propre titre en HTML.
7. Étoiles/icônes en **SVG inline** (jamais ★ ni emoji) ; images uploadées via
   `upload_media` (S3), jamais hotlinkées depuis un site tiers.
8. Aucune ligne orpheline : toute info isolée devient une carte 2 lignes
   (titre + texte muted).

## Étape 4 — Check-list de livraison (bloquante)

Vérifier sur la quotation LIVE avant de livrer — un point en échec = pas terminé :

1. Chaque bloc a un `title` non vide.
2. Header natif rempli (logo + cover émetteur).
3. Chaque ligne produit a une image.
4. Aucun `<style>` résiduel hors `@font-face` (test mental : si on supprime tous les
   `<style>`, le bloc reste présentable).
5. `DuoDeal.autoResize()` en fin de chaque bloc html.
6. Récurrent dans le récap html, pas dans la table native.
7. Pas de « — », pas de ★, pas de placeholder `{{…}}` oublié.
8. **Vérification visuelle réelle** : ouvrir l'`editionLink` (`get_links`) et contrôler
   le rendu — puis livrer les 2 liens (client + édition).
