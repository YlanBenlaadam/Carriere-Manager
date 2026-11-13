import type { Club, Competition, CompetitionEurope } from './types'
import type { Rng } from './rng'

// Seuils de prestige (réglage). Rappel des paliers de nos données :
// géant 100 / gros 78 / moyen 62 / petit 48 / modeste 36.
const SEUIL_CADOR = 90 // à partir de là, un club est un "cador" (en pratique les 100)
const SEUIL_EUROPA = 60 // à partir de là (et sous cador), le club joue l'Europa

// Quelle coupe d'Europe joue un club, selon son prestige ?
//   >= 90 (cador)      → Ligue des Champions
//   60 à 89 (mid)      → Europa League
//   < 60 (petit)       → aucune
export function competitionEuropeenne(prestige: number): CompetitionEurope | null {
  if (prestige >= SEUIL_CADOR) {
    return 'ldc'
  }
  if (prestige >= SEUIL_EUROPA) {
    return 'europa'
  }
  return null
}

// Tire un club au hasard dans une liste (même technique d'index que partout).
function piocherClub(pool: Club[], rng: Rng): Club {
  const index = Math.floor(rng() * pool.length)
  return pool[index]
}

// Choisit l'adversaire de la finale d'une compétition, selon ses règles.
// Rappel : un Club (types.ts) a { id, championnat, prestige, ... }.
export function choisirAdversaireFinale(
  competition: Competition,
  monClub: Club,
  tousLesClubs: Club[],
  rng: Rng,
): Club {
  // On ne peut évidemment pas s'affronter soi-même.
  const autres = tousLesClubs.filter((c) => c.id !== monClub.id)

  if (competition === 'coupe_nationale') {
    // Finale nationale → un adversaire du MÊME championnat.
    const memeChampionnat = autres.filter((c) => c.championnat === monClub.championnat)

    if (monClub.prestige >= SEUIL_CADOR) {
      // On est un cador : on peut tomber sur n'importe quel club du championnat.
      return piocherClub(memeChampionnat, rng)
    }

    // On est plus petit : on tombe sur un cador du championnat (dur à battre).
    const cadors = memeChampionnat.filter((c) => c.prestige >= SEUIL_CADOR)
    // Filet de sécurité : s'il n'y a aucun cador, on prend n'importe qui.
    const pool = cadors.length > 0 ? cadors : memeChampionnat
    return piocherClub(pool, rng)
  }

  if (competition === 'ldc') {
    // Finale de LDC = deux cadors → adversaire de prestige élevé, tous pays confondus.
    const cadors = autres.filter((c) => c.prestige >= SEUIL_CADOR)
    return piocherClub(cadors, rng)
  }

  // Europa : adversaire "mid" (prestige entre le seuil Europa et le seuil cador).
  const mids = autres.filter((c) => c.prestige >= SEUIL_EUROPA && c.prestige < SEUIL_CADOR)
  return piocherClub(mids, rng)
}
