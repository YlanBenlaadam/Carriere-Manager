// --- Fabrique une "fiche bilan" de carrière sous forme d'IMAGE (PNG) ---
// But : à la fin d'une carrière, pouvoir TÉLÉCHARGER une belle carte résumé
// (club, note, palmarès...) et la PARTAGER (menu natif du téléphone).
//
// Principe, en 3 temps :
//   1. construireSvgFiche() fabrique une image vectorielle (SVG) = du texte XML
//      qui décrit des rectangles, cercles et textes. Facile à composer à la main.
//   2. svgVersPngBlob() peint ce SVG sur un <canvas> invisible, puis exporte un
//      PNG (un "Blob" = un paquet binaire de données en mémoire).
//   3. telechargerBlob() / partagerFiche() font quelque chose de ce PNG.
// Aucune dépendance externe : tout passe par des API natives du navigateur.

// Les données prêtes à dessiner (le composant les calcule et nous les passe).
export interface DonneesFiche {
  titreClub: string // nom du dernier club
  couleurClub: string // couleur principale du club (pour la pastille)
  couleurClubBordure: string // couleur secondaire (bordure de la pastille)
  nbSaisons: number
  noteMoyenne: number
  nbTrophees: number // total de trophées, toutes compétitions (≠ titres de champion seuls)
  reputation: number
  // Lignes de palmarès à afficher (uniquement celles dont le nombre > 0).
  palmares: { label: string; nombre: number }[]
}

// Dimensions de la carte : format portrait 4:5 (idéal story Insta / partage mobile).
const LARGEUR = 1080
const HAUTEUR = 1350

// Palette : on RECOPIE ici les couleurs des tokens de index.css. Un SVG autonome
// (rendu hors du DOM) ne peut pas lire les var(--...) CSS, d'où les hex en dur.
const COULEURS = {
  fond: '#0e1116',
  surface: '#171b22',
  surface2: '#1f242d',
  bordure: '#2a313c',
  texte: '#e6e9ee',
  doux: '#9aa4b1',
  accent: '#22c55e',
  or: '#fbbf24',
  danger: '#ef4444',
}
// Même pile de polices système que le site (pas de police externe à charger).
const POLICE = 'system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif'

// Échappe les caractères spéciaux XML. INDISPENSABLE : un nom comme
// "Brighton & Hove Albion" casserait le SVG si le "&" n'était pas transformé.
function echapperXml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Couleur de la note (mêmes seuils que partout : vert ≥7, or ≥5, rouge sinon).
function couleurNote(note: number): string {
  if (note >= 7) {
    return COULEURS.accent
  }
  if (note >= 5) {
    return COULEURS.or
  }
  return COULEURS.danger
}

// Construit le SVG (une grande chaîne de caractères) de la fiche.
export function construireSvgFiche(donnees: DonneesFiche): string {
  // Note affichée au format français ("7,4" plutôt que "7.4").
  const noteTexte = donnees.noteMoyenne.toFixed(1).replace('.', ',')

  // Lignes de palmarès : une puce dorée + "×N" + le libellé, empilées. Si le
  // palmarès est vide, un petit message d'encouragement à la place.
  // ici on parcourt le tableau des lignes de palmarès et 
  // pour chaque ligne on crée un cercle doré et deux textes (×N et le libellé)
  // le tableau est sous cette forme : [{label: 'Champion', nombre: 3}, {label: 'Coupe nationale', nombre: 1}]
  // decomposons : 1040 -> position verticale de la première ligne, 
  // index * 64 -> chaque ligne est espacée de 64px
  let palmaresSvg = ''
  if (donnees.palmares.length > 0) {
    palmaresSvg = donnees.palmares
      .map((ligne, index) => { 
        const y = 1040 + index * 64 // chaque ligne 64px plus bas que la précédente
        return `
    <circle cx="112" cy="${y - 9}" r="9" fill="${COULEURS.or}" />
    <text x="140" y="${y}" font-size="32" font-weight="700" fill="${COULEURS.texte}" font-family="${POLICE}">×${ligne.nombre}</text>
    <text x="210" y="${y}" font-size="32" fill="${COULEURS.doux}" font-family="${POLICE}">${echapperXml(ligne.label)}</text>`
      })
      .join('')
  } else {
    palmaresSvg = `
    <text x="88" y="1040" font-size="30" fill="${COULEURS.doux}" font-family="${POLICE}">Aucun trophée cette fois — la prochaine sera la bonne.</text>`
  }

  // Le SVG complet. Chaque <text>/<rect>/<circle> est positionné en coordonnées
  // absolues (x, y en pixels). text-anchor="middle" = texte centré sur son x.
  // explication de chaque attribut pour les textes :
  // x : position horizontale du texte
  // y : position verticale du texte (la ligne de base du texte)
  // text-anchor : comment le texte est aligné par rapport à x (middle = centré)
  // font-size : taille de la police
  // font-weight : épaisseur de la police (700 = gras)
  // fill : couleur du texte
  // font-family : famille de polices à utiliser
  // explication de chaque attribut pour les rectangles :
  // x : position horizontale du rectangle
  // y : position verticale du rectangle
  // width : largeur du rectangle
  // height : hauteur du rectangle
  // rx : rayon des coins arrondis (0 = coins carrés)
  // fill : couleur de remplissage du rectangle
  // stroke : couleur de la bordure du rectangle
  // stroke-width : épaisseur de la bordure du rectangle
  // et donc associer les textes et les rectangles aux données de la fiche 
  // permet d'avoir en gros en affichage : le nom du club, la note moyenne, le nombre de saisons, le nombre de titres, 
  // la réputation et le palmarès.

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}" viewBox="0 0 ${LARGEUR} ${HAUTEUR}">
    <rect width="${LARGEUR}" height="${HAUTEUR}" fill="${COULEURS.fond}" />
    <rect x="24" y="24" width="${LARGEUR - 48}" height="${HAUTEUR - 48}" rx="28" fill="${COULEURS.surface}" stroke="${COULEURS.bordure}" stroke-width="2" />

    <text x="540" y="130" text-anchor="middle" font-size="34" letter-spacing="6" font-weight="700" fill="${COULEURS.accent}" font-family="${POLICE}">CARRIÈRE MANAGER</text>
    <text x="540" y="214" text-anchor="middle" font-size="60" font-weight="700" fill="${COULEURS.texte}" font-family="${POLICE}">Bilan de carrière</text>

    <circle cx="540" cy="322" r="36" fill="${donnees.couleurClub}" stroke="${donnees.couleurClubBordure}" stroke-width="4" />
    <text x="540" y="414" text-anchor="middle" font-size="38" font-weight="600" fill="${COULEURS.texte}" font-family="${POLICE}">${echapperXml(donnees.titreClub)}</text>

    <rect x="320" y="470" width="440" height="210" rx="24" fill="${COULEURS.surface2}" stroke="${COULEURS.bordure}" stroke-width="2" />
    <text x="540" y="598" text-anchor="middle" font-size="122" font-weight="700" fill="${couleurNote(donnees.noteMoyenne)}" font-family="${POLICE}">${noteTexte}</text>
    <text x="540" y="664" text-anchor="middle" font-size="26" letter-spacing="2" fill="${COULEURS.doux}" font-family="${POLICE}">NOTE MOYENNE / 10</text>

    <text x="300" y="800" text-anchor="middle" font-size="58" font-weight="700" fill="${COULEURS.texte}" font-family="${POLICE}">${donnees.nbSaisons}</text>
    <text x="300" y="842" text-anchor="middle" font-size="26" fill="${COULEURS.doux}" font-family="${POLICE}">saison(s)</text>
    <text x="540" y="800" text-anchor="middle" font-size="58" font-weight="700" fill="${COULEURS.or}" font-family="${POLICE}">${donnees.nbTrophees}</text>
    <text x="540" y="842" text-anchor="middle" font-size="26" fill="${COULEURS.doux}" font-family="${POLICE}">trophée(s)</text>
    <text x="780" y="800" text-anchor="middle" font-size="58" font-weight="700" fill="${COULEURS.texte}" font-family="${POLICE}">${donnees.reputation}</text>
    <text x="780" y="842" text-anchor="middle" font-size="26" fill="${COULEURS.doux}" font-family="${POLICE}">réputation</text>

    <line x1="88" y1="908" x2="992" y2="908" stroke="${COULEURS.bordure}" stroke-width="2" />
    <text x="88" y="978" font-size="30" letter-spacing="4" font-weight="700" fill="${COULEURS.doux}" font-family="${POLICE}">PALMARÈS</text>
    ${palmaresSvg}

    <text x="540" y="1300" text-anchor="middle" font-size="26" fill="${COULEURS.doux}" font-family="${POLICE}">Carrière Manager — à toi de jouer</text>
  </svg>`
}

// Peint le SVG sur un canvas et renvoie un PNG (Blob). Renvoie une Promise car le
// chargement de l'image SVG est asynchrone (on attend son onload).
export function svgVersPngBlob(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // On emballe le SVG dans un Blob, puis on en fait une URL temporaire que
    // l'<img> peut charger. (Même origine → le canvas ne sera pas "souillé",
    // donc l'export PNG restera autorisé.)
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = LARGEUR
      canvas.height = HAUTEUR
      const ctx = canvas.getContext('2d')
      if (ctx === null) {
        URL.revokeObjectURL(url)
        reject(new Error('Contexte 2D du canvas indisponible'))
        return
      }
      ctx.drawImage(image, 0, 0, LARGEUR, HAUTEUR)
      URL.revokeObjectURL(url) // on libère l'URL temporaire dès que c'est peint
      // toBlob est asynchrone : il nous rend le PNG une fois encodé.
      canvas.toBlob((blob) => {
        if (blob === null) {
          reject(new Error("L'export PNG a échoué"))
          return
        }
        resolve(blob)
      }, 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Chargement du SVG impossible'))
    }
    image.src = url
  })
}

// Déclenche le téléchargement d'un Blob sous un nom de fichier donné. Astuce
// classique : on crée un lien <a download> invisible et on "clique" dessus.
export function telechargerBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  URL.revokeObjectURL(url)
}

// Partage l'image via le menu natif du téléphone (Web Share API). Si l'appareil
// ne sait pas partager un fichier (souvent le cas sur ordinateur), on retombe sur
// la copie du texte dans le presse-papier. Renvoie ce qui s'est réellement passé.
export async function partagerFiche(
  blob: Blob,
  nomFichier: string,
  texte: string,
): Promise<'partage' | 'copie' | 'echec'> {
  const fichier = new File([blob], nomFichier, { type: 'image/png' })

  // navigator.canShare({files}) = "cet appareil sait-il partager ce fichier ?"
  if (
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [fichier] }) &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({ files: [fichier], text: texte })
      return 'partage'
    } catch {
      // L'utilisateur a annulé le menu de partage, ou une erreur est survenue.
      return 'echec'
    }
  }

  // Repli : pas de partage de fichier possible → on copie au moins le texte.
  try {
    await navigator.clipboard.writeText(texte)
    return 'copie'
  } catch {
    return 'echec'
  }
}
