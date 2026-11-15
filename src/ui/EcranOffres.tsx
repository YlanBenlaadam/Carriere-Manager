import { CLUBS } from '../data/clubs'
import { etoiles } from './format'
import type { GameState, Club } from '../game/types'
import './EcranOffres.css'

// Écran d'intersaison : le coach reste à son club ou accepte une offre.
// Props :
//  - etat   : l'état de la partie APRÈS la saison (réputation déjà mise à jour)
//  - offres : les clubs qui font une offre
//  - onChoisir : appelée avec 'rester' ou l'id du club choisi
export function EcranOffres({
  etat,
  offres,
  onChoisir,
}: {
  etat: GameState
  offres: Club[]
  onChoisir: (choix: string) => void
}) {
  const clubActuel = CLUBS.find((c) => c.id === etat.clubId)!

  return (
    <div className="offres">
      <h1 className="offres__titre">Intersaison</h1>
      <p className="offres__sous">Ta réputation : {etat.reputation} / 100</p>

      {/* Option 1 : rester à son club actuel (prolongation). */}
      <button type="button" className="offres__rester" onClick={() => onChoisir('rester')}>
        Rester à {clubActuel.nom}
      </button>

      {/* Option 2 : accepter une offre. On n'affiche la section que s'il y en a. */}
      {offres.length > 0 ? (
        <>
          <h2 className="offres__h2">Clubs intéressés</h2>
          <div className="offres__liste">
            {offres.map((club) => (
              <button
                type="button"
                className="carte-offre"
                key={club.id}
                onClick={() => onChoisir(club.id)}
              >
                <span
                  className="carte-offre__pastille"
                  style={{ background: club.couleurs.principale, borderColor: club.couleurs.secondaire }}
                ></span>
                <span className="carte-offre__nom">{club.nom}</span>
                <span className="carte-offre__etoiles">{etoiles(club.prestige)}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="offres__vide">Aucune offre cette saison — continue l'aventure ici.</p>
      )}
    </div>
  )
}
