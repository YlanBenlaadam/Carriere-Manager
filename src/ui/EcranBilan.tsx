import { useState } from 'react'
import { CLUBS } from '../data/clubs'
import { EFFECTIFS } from '../data/effectifs'
import { classementAvecResultatsJoueur, forceGlobale, faireBilan } from '../game/saison'
import { creerRng } from '../game/rng'
import type { GameState, ResultatRencontre, Player, LigneClassement, Bilan } from '../game/types'
import './EcranBilan.css'

// Ce qu'on calcule une fois pour l'affichage du bilan.
interface DonneesBilan {
  classement: LigneClassement[]
  bilan: Bilan
}

// Assemble le classement final (nos résultats + reste simulé) et le bilan du joueur.
function calculerBilanSaison(partie: GameState, resultatsSaison: ResultatRencontre[]): DonneesBilan {
  const monClub = CLUBS.find((c) => c.id === partie.clubId)!
  const clubIds = CLUBS.filter((c) => c.championnat === monClub.championnat).map((c) => c.id) // tous les clubs du championnat de NOTRE club

  // Effectifs : NOTRE club = l'effectif (à jour) de la partie ; les autres = données.
  const effectifsParClub: Record<string, Player[]> = {}
  for (const id of clubIds) {
    if (id === partie.clubId) { // notre club = l'effectif actuel de la partie
      effectifsParClub[id] = partie.effectif //en gros on recupere l'effectif de la partie en cours (notre club) et pour les autres clubs on recupere les effectifs des données
    } else {
      effectifsParClub[id] = EFFECTIFS[id]
    }
  }

  // Graine stable pour que le bilan ne change pas à chaque re-render.
  const rng = creerRng(partie.seed + partie.saison * 1000)
  const classement = classementAvecResultatsJoueur(clubIds, partie.clubId, resultatsSaison, effectifsParClub, rng)

  // Force globale de chaque club → classement attendu (pour la surperformance).
  const forcesParClub: Record<string, number> = {}
  for (const id of clubIds) {
    forcesParClub[id] = forceGlobale(effectifsParClub[id])
  }

  const bilan = faireBilan(partie.clubId, classement, forcesParClub, partie.jauges, rng)
  return { classement, bilan }
}

// Écran de bilan de fin de saison. onTerminer est appelée au clic sur "Continuer",
// avec le bilan calculé (App s'en sert pour clôturer la saison).
export function EcranBilan({
  partie,
  resultatsSaison,
  onTerminer,
}: {
  partie: GameState
  resultatsSaison: ResultatRencontre[]
  onTerminer: (bilan: Bilan) => void
}) {
  // Calcul fait UNE fois au montage (initialiseur de useState).
  const [donnees] = useState(() => calculerBilanSaison(partie, resultatsSaison))
  const { classement, bilan } = donnees

  // Nom lisible d'un club depuis son id.
  function nomDe(id: string): string {
    return CLUBS.find((c) => c.id === id)!.nom
  }

  // Couleur de la note : vert (excellent ≥ 7), jaune (moyen 5-6), rouge (raté < 5).
  let couleurNote = 'var(--danger)'
  if (bilan.note >= 7) {
    couleurNote = 'var(--accent)'
  } else if (bilan.note >= 5) {
    couleurNote = 'var(--or)'
  }

  return (
    <div className="bilan">
      <h1 className="bilan__titre">Bilan — Saison {partie.saison}</h1>

      {/* Mention "Champion" seulement si on finit 1er (rendu conditionnel &&). */}
      {bilan.rangReel === 1 && <p className="bilan__champion">🏆 Champion !</p>}

      {/* La note de la saison, bien mise en avant et colorée selon sa valeur. */}
      <div className="bilan__note">
        <span className="bilan__note-valeur" style={{ color: couleurNote }}>
          {bilan.note}
        </span>
        <span className="bilan__note-label">/ 10</span>
      </div>
      <p className="bilan__rangs">Classé {bilan.rangReel}ᵉ du championnat</p>

      {/* Le classement final du championnat (notre ligne surlignée). */}
      <table className="classement">
        <thead>
          <tr>
            <th>#</th>
            <th className="classement__club">Club</th>
            <th>Pts</th>
            <th>Diff</th>
          </tr>
        </thead>
        <tbody>
          {classement.map((ligne, index) => {
            // On surligne la ligne de NOTRE club.
            let classeLigne = ''
            if (ligne.clubId === partie.clubId) {
              classeLigne = 'classement__nous'
            }
            const diff = (ligne.difference >= 0 ? '+' : '') + ligne.difference
            return (
              <tr key={ligne.clubId} className={classeLigne}>
                <td>{index + 1}</td>
                <td className="classement__club">{nomDe(ligne.clubId)}</td>
                <td>{ligne.points}</td>
                <td>{diff}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button type="button" className="bilan__continuer" onClick={() => onTerminer(bilan)}>
        Continuer
      </button>
    </div>
  )
}
