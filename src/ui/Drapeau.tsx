import './Drapeau.css'

// --- Drapeaux nationaux dessinés en CSS ---
// On n'utilise PAS les emojis drapeaux : sous Windows ils s'affichent mal
// (🏴 Angleterre → drapeau NOIR, 🇫🇷 → les lettres "FR"). On dessine donc nous-mêmes
// chaque drapeau à partir des données ci-dessous. Une seule source de vérité qui sert
// à la fois au mini-drapeau (titre de la finale) et à la teinte de la pelouse.

// Disposition : bandes verticales (France, Italie), horizontales (Espagne, Allemagne),
// ou une croix (Angleterre = croix de Saint-Georges).
export type SensDrapeau = 'vertical' | 'horizontal' | 'croix'

export interface DonneesDrapeau {
  sens: SensDrapeau
  bandes: string[] // couleurs des bandes, dans l'ordre (pour la croix : [fond, croix])
  poids?: number[] // largeur relative de chaque bande (défaut : toutes égales)
  pelouse: string[] // 2 OU 3 teintes pour la pelouse (tricolore pour France/Italie/Allemagne)
}

export const DRAPEAUX: Record<string, DonneesDrapeau> = {
  France: {
    sens: 'vertical',
    bandes: ['#0055A4', '#FFFFFF', '#EF4135'],
    pelouse: ['#16235c', '#FFFFFF'], // bleu nuit + blanc cassé
  },
  Angleterre: {
    sens: 'croix',
    bandes: ['#FFFFFF', '#CE1124'], // fond blanc + croix rouge
    pelouse: ['#8a1420', '#5e0e16'], // deux rouges profonds
  },
  Espagne: {
    sens: 'horizontal',
    bandes: ['#AA151B', '#F1BF00', '#AA151B'],
    poids: [1, 2, 1], // la bande jaune fait le double (comme le vrai drapeau)
    pelouse: ['#7a1015', '#8a6a07'], // rouge foncé + or foncé
  },
  Italie: {
    sens: 'vertical',
    bandes: ['#009246', '#FFFFFF', '#CE2B37'],
    pelouse: ['#008c45', '#DD0000'], // vert foncé + blanc cassé
  },
  Allemagne: {
    sens: 'horizontal',
    bandes: ['#000000', '#DD0000', '#FFCE00'],
    pelouse: ['#0f0f0f', '#DD0000'], // noir profond + rouge foncé
  },
}

// Renvoie le dégradé "bandes de tonte" aux couleurs (assombries) du pays, à poser
// en style inline sur la pelouse d'une finale de coupe nationale. undefined si le
// championnat est inconnu (on retombe alors sur la pelouse verte par défaut).
export function pelouseDuPays(championnat: string): string | undefined {
  const drapeau = DRAPEAUX[championnat]
  if (drapeau === undefined) {
    return undefined
  }
  // On construit une bande de 40px par couleur, puis le motif se répète sur toute la
  // largeur. Ex. 3 couleurs → "c0 0 40px, c1 40px 80px, c2 80px 120px" (motif de 120px).
  const LARGEUR = 40
  const segments = drapeau.pelouse.map((couleur, index) => {
    const debut = index * LARGEUR
    const fin = (index + 1) * LARGEUR
    return `${couleur} ${debut}px ${fin}px`
  })
  // 90deg = bandes verticales ; join(', ') = on colle les segments séparés par une virgule.
  return `repeating-linear-gradient(90deg, ${segments.join(', ')})`
}

// Le composant : dessine le drapeau du championnat demandé (ou rien si inconnu).
export function Drapeau({ championnat }: { championnat: string }) {
  const drapeau = DRAPEAUX[championnat]
  if (drapeau === undefined) {
    return null
  }

  // Cas particulier : la croix de Saint-Georges (Angleterre) = un fond blanc avec
  // une barre rouge horizontale et une barre rouge verticale, centrées.
  if (drapeau.sens === 'croix') {
    const fond = drapeau.bandes[0]
    const croix = drapeau.bandes[1]
    return (
      <span className="drapeau drapeau--croix" style={{ background: fond }}>
        <span className="drapeau__croix-h" style={{ background: croix }}></span>
        <span className="drapeau__croix-v" style={{ background: croix }}></span>
      </span>
    )
  }

  // Cas général : des bandes. Verticales → les bandes se suivent en ligne (row) ;
  // horizontales → elles s'empilent en colonne (column).
  let direction: 'row' | 'column' = 'column'
  // si le drapeau est vertical, on met les bandes en ligne (row)
  if (drapeau.sens === 'vertical') {
    direction = 'row'
  }
  return (
    // flexDirection = row → les bandes se suivent en ligne ; column → elles s'empilent en colonne
    <span className="drapeau" style={{ flexDirection: direction }}>
      {/* On parcourt les couleurs des bandes et on crée un <span> pour chaque bande, avec la couleur de fond correspondante
          span = élément en ligne, donc les bandes se suivent en ligne ou en colonne selon le flexDirection
          flexGrow = poids de la bande (largeur relative) permet de faire des bandes de largeur différente 
          si le drapeau le demande (ex. Espagne)
      */}
      {drapeau.bandes.map((couleur, index) => {
        // Largeur relative de la bande : son poids si défini, sinon 1 (bandes égales).
        let poids = 1
        if (drapeau.poids !== undefined) {
          poids = drapeau.poids[index]
        }
        return (
          <span
            key={index}
            className="drapeau__bande"
            style={{ background: couleur, flexGrow: poids }}
          ></span>
        )
      })}
    </span>
  )
}
