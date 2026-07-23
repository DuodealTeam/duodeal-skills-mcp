# Design system d'un devis — tokens, typo, mise en page

## Dériver les 7 tokens du branding de l'émetteur

- **ACCENT** : la couleur signature de la marque (bouton principal du site, logo).
  UNE seule. Si la marque a plusieurs couleurs, prendre celle des CTA.
  Usage : eyebrows, chiffres des KPIs, UN mot du H1, badges numérotés, petit trait
  décoratif. Jamais en fond de grandes zones de texte.
- **INK** : le quasi-noir de la marque pour les titres (ex. `#1a1d24`, `#14202b`) —
  jamais `#000` pur.
- **MUTED** : gris du texte courant (ex. `#5c6470`) — lisible, contraste ≥ 4.5:1 sur blanc.
- **PAPER** : fond de carte claire teinté (crème/ivoire/gris chaud très clair, ex.
  `#faf7f2`, `#f7f8fa`) — pas blanc pur, c'est lui qui donne le côté « premium ».
- **LINE** : bordure douce (ex. `#e8e6e1`, `#e5e8ec`).
- **DARK** : le fond sombre de marque (cartes « problème », CTA) — souvent une version
  très foncée de l'ACCENT ou l'INK.
- **FONT** : la police de marque AVEC fallback complet :
  `'Police',-apple-system,'Segoe UI',Roboto,sans-serif`.
  Option : une SERIF d'apparat pour quelques titres (nom de l'émetteur, titre FAQ).

Vérifier l'ensemble sur un fond blanc ET sur DARK avant de produire les blocs.

## Polices de marque : la règle honnête

- Par défaut : **police système via la stack de fallback** — zéro risque.
- `@font-face` en base64 dans un `<style>` est la SEULE exception tolérée à la règle
  « aucun `<style>` »… mais l'auto-save de l'éditeur peut le supprimer si le
  commercial édite le bloc. Donc : ne l'utiliser que si la police de marque est
  indispensable, et concevoir le bloc pour rester beau en fallback.

## Hiérarchie typographique (valeurs éprouvées)

| Élément | Style |
|---|---|
| Eyebrow | 12 px, 800, `letter-spacing:.16em`, uppercase, couleur ACCENT |
| H1 (intro) | 27 px, 800, line-height 1.2, INK, UN `<span style="color:ACCENT">` |
| H2 de section | 23-24 px, 800, line-height 1.25, INK |
| Titre de carte | 15-15.5 px, 800, INK |
| Corps | 15 px, line-height 1.75, MUTED |
| Texte de carte | 13.5 px, line-height 1.65, MUTED |
| Chiffre KPI | 22 px, 800, ACCENT |
| Légende KPI | 11.5 px, MUTED |
| Notes / mentions | 12.5 px, line-height 1.6, MUTED |

## Mise en page

- Largeur de contenu : `max-width:780-860px;margin:0 auto;padding:0 18px`
  (780 pour les sections denses type récap/FAQ, 860 pour les grilles de cartes).
- Cartes : fond `#fff` (ou PAPER), `border:1px solid LINE`, `border-radius:14-16px`,
  padding `22px 24px` à `26px 28px`. Grandes cartes CTA : radius 20 px.
- **Responsive sans media query** : conteneur
  `display:flex;flex-wrap:wrap;gap:14px`, enfants `flex:1 1 340px` (2 colonnes qui
  passent en 1 sur mobile) ou `flex:1 1 150px;min-width:140px` (bande de 4 KPIs qui
  passe en 2×2).
- Anti-coupure PDF : `break-inside:avoid;page-break-inside:avoid` sur chaque carte.
- Spacers : `<div style="height:71px" aria-hidden="true"></div>` en tête et pied de
  chaque bloc html (pied de liasse légale : ≤ 16 px). Jamais de spacer À L'INTÉRIEUR
  d'une carte.
- Boutons/pastilles : `border-radius:999px;padding:12px 26px;font-weight:800`.

## Images

- Toutes les images passent par `upload_media` (S3 Duodeal) — jamais de hotlink.
- Logos du lockup d'intro : tuile émetteur ~96 px (radius 20 px), wordmark prospect
  ~34 px de haut ; à défaut de fichier logo prospect, un wordmark texte stylé
  (`font-size:34px`, 800, INK) fait l'affaire.
- Mur de logos : vrais fichiers, hauteur réglée PAR logo pour l'équilibre visuel
  (20-40 px), rangées centrées `display:flex;justify-content:center;flex-wrap:wrap;gap:44px`.
- Photo du commercial : vraie photo, recadrée carrée centrée visage, rendue ronde
  (`border-radius:50%`, 96 px, `object-fit:cover`).
- Chaque ligne produit du pricing porte une image (upload_media → `medias:[{id}]`).
