# CoinSphere reference analysis

## Visual decomposition

The supplied 1504 × 1152 reference uses a warm orange outer canvas around a nearly black panel with large corner radii. Inside the panel, a narrow top navigation frames a centered, three-line hero; the hero sits above a perspective floor grid, while thin amber light bands converge from the left and right edges. A dense, asymmetrical dashboard collage occupies the lower third. Its cards vary in size and elevation, with one saturated orange focal card and subdued charcoal surfaces around it.

The adaptation keeps that frame, centered hierarchy, converging light, perspective grid, and varied card collage. It uses OTIZ typography and labels, product-cycle imagery made from CSS and interface primitives, and no copied CoinSphere marks or crypto assets. All figures in the supplied reference are removed.

## Element mapping

| CoinSphere element | OTIZ Capital adaptation | Preserved | Changed |
|---|---|---|---|
| Orange page surround and rounded black panel | Warm perimeter around the OTIZ home experience | Frame, contrast, radius, scale | Brand identity |
| Minimal header | Operations, transparency, process, FAQ, calculator, investor access | Left brand / centered navigation / right actions | Labels and destinations |
| Centered hero and orange phrase | Russian statement about electronics trade capital | Alignment, line scale, orange emphasis, negative space | Copy and CTA destinations |
| Side light ribbons | Amber lines leading toward the hero | Direction and restrained glow | Color tuned to OTIZ orange |
| Perspective floor grid | Abstract commerce infrastructure grid | Vanishing point and low contrast | No blockchain motifs |
| BTC focal card | Non-numeric electronics supply cycle card | Size, orange focal surface, depth | Product and process content |
| Balance and asset cards | Reporting, procurement, logistics, marketplace sale | Asymmetric, layered dashboard collage | No fabricated balances or trading figures |
| Fear/greed and swap cards | Process and evidence summaries | Compact widget density | No speculative sentiment or exchange tools |

## Design tokens

| Token | Value | Use |
|---|---|---|
| Canvas | `#080808` | Dark app background |
| Surface | `#121212` | Cards and panels |
| Elevated surface | `#191715` | Focused cards |
| OTIZ orange | `#FF821C` | Primary actions and emphasis |
| Deep orange | `#D86A17` | Hover, gradient depth |
| Primary text | `#F5F5F5` | Headings and important data |
| Secondary text | `#A1A1A1` | Supporting labels |
| Hairline | `rgba(255,255,255,.08)` | Borders and dividers |
| Glow | `rgba(255,130,28,.18)` | Large atmospheric light |

## Responsive constraints

At desktop widths the outer orange surround remains visible, the hero stays centered, and the collage preserves unequal card sizes. Below tablet width, hide decorative floor geometry, stack the cards in a readable order, keep all navigation actions reachable through the existing menu, and prevent any fixed-width dashboard from causing horizontal overflow. Motion remains disabled under `prefers-reduced-motion`.
