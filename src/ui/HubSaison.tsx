import { CLUBS } from '../data/clubs'
import { etoiles } from './format'
import type { GameState } from '../game/types'
import './HubSaison.css'

// --- Petit composant réutilisable : UNE jauge (label + barre de progression). ---
// Un composant peut en utiliser un autre : HubSaison affichera 4 fois <Jauge />.
// Props : le libellé à afficher et la valeur 0-100.
// la fonction prend en paramètre un objet { label, valeur } et on précise le type de cet objet.
function Jauge({ label, valeur }: { label: string; valeur: number }) {
  // Couleur de la barre : rouge si la jauge est basse (risque de licenciement),
  // verte sinon. On calcule la couleur avant le rendu (plus lisible qu'en ligne).
  let couleur = 'var(--accent)'
  if (valeur < 25) {
    couleur = 'var(--danger)'
  }
  // on comprend ici que le return a chaque fois signifie ce qui sera affiché à l'écran. Ici on a un div avec la classe "jauge"...
  return (
    <div className="jauge">
      {/* En-tête de la jauge : le nom à gauche, la valeur à droite. */}
      <div className="jauge__entete">
        <span className="jauge__label">{label}</span>
        <span className="jauge__valeur">{valeur}</span>
      </div>

      {/* "piste" = le rail gris de fond ; "remplissage" = la partie colorée.
          La largeur du remplissage = la valeur en % (ex. 60 → "60%"), appliquée
          en style inline car elle est dynamique. */}
      <div className="jauge__piste">
        <div
          className="jauge__remplissage"
          style={{ width: valeur + '%', background: couleur }}
        ></div>
      </div>
    </div>
  )
}

// --- Le hub de saison : écran principal une fois le club choisi. ---
// Props : la partie en cours, le libellé du bouton (ex. "Jouer le match clé 3/5"
// ou "Finale — Ligue des Champions"), et onJouer (clic sur ce bouton).
export function HubSaison({
  partie,
  labelBouton,
  onJouer,
}: {
  partie: GameState
  labelBouton: string
  onJouer: () => void
}) {
  // On retrouve les infos du club (nom, couleurs, prestige) à partir de son id.
  // Le "!" dit à TypeScript "je garantis qu'il existe" (le club vient forcément des données).
  const club = CLUBS.find((c) => c.id === partie.clubId)!

  // Effectif trié du meilleur au moins bon. [...] = une COPIE, car sort() modifie
  // le tableau, et on ne veut pas toucher à l'effectif de la partie.
  const effectifTrie = [...partie.effectif].sort((a, b) => b.niveau - a.niveau)

  return (
    <div className="hub">
      {/* En-tête : pastille du club + nom + infos (championnat, saison, étoiles). */}
      <header className="hub__entete">
        <span
          className="hub__pastille"
          style={{ background: club.couleurs.principale, borderColor: club.couleurs.secondaire }}
        ></span>
        <div>
          <h1 className="hub__nom">{club.nom}</h1>
          <p className="hub__meta">
            {club.championnat} · Saison {partie.saison} ·{' '}
            <span className="hub__etoiles">{etoiles(club.prestige)}</span>
          </p>
        </div>
      </header>

      {/* Bouton principal : jouer le prochain match (championnat ou finale). Le
          libellé est fourni par le parent (App). */}
      <button type="button" className="hub__jouer" onClick={onJouer}>
        {labelBouton}
      </button>

      {/* Les 4 jauges, chacune via le composant <Jauge />. */}
       {/* la fonction jauge se charge de l'affichage de chaque jauge, on lui passe le label et la valeur. */}
      <section className="hub__jauges">
        <Jauge label="Direction" valeur={partie.jauges.direction} />
        <Jauge label="Vestiaire" valeur={partie.jauges.vestiaire} />
        <Jauge label="Fans" valeur={partie.jauges.fans} />
        <Jauge label="Trésorerie" valeur={partie.jauges.tresorerie} />
      </section>

      {/* L'effectif, en liste. */}
      <section className="hub__effectif">
        <h2>Effectif</h2>
        <ul className="liste-joueurs">
          {effectifTrie.map((joueur) => (
            <li className="joueur" key={joueur.id}>
              <span className="joueur__poste">{joueur.poste}</span>
              <span className="joueur__nom">
                {joueur.prenom} {joueur.nom}
              </span>
              <span className="joueur__age">{joueur.age} ans</span>
              <span className="joueur__niveau">{joueur.niveau}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
