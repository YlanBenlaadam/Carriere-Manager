import type { Issue, Score } from './types'
import type { Rng } from './rng'

// Tables de scores plausibles, définies une seule fois au niveau du module
// (ce sont des données fixes, inutile de les reconstruire à chaque appel).
const SCORES_VICTOIRE: Score[] = [
  { butsPour: 1, butsContre: 0 },
  { butsPour: 2, butsContre: 0 },
  { butsPour: 2, butsContre: 1 },
  { butsPour: 3, butsContre: 0 },
  { butsPour: 3, butsContre: 1 },
  { butsPour: 3, butsContre: 2 },
  { butsPour: 4, butsContre: 1 },
  { butsPour: 4, butsContre: 2 },
  { butsPour: 1, butsContre: 0 }, // score serré fréquent → présent 2 fois = plus probable
  { butsPour: 2, butsContre: 1 }, // idem (les gros cartons restent rares)
]
const SCORES_NUL: Score[] = [
  { butsPour: 0, butsContre: 0 },
  { butsPour: 1, butsContre: 1 },
  { butsPour: 2, butsContre: 2 },
  { butsPour: 1, butsContre: 1 }, // 1-1 très courant → doublé pour être plus probable
  { butsPour: 3, butsContre: 3 },
]
const SCORES_DEFAITE: Score[] = [
  { butsPour: 0, butsContre: 1 },
  { butsPour: 0, butsContre: 2 },
  { butsPour: 1, butsContre: 2 },
  { butsPour: 0, butsContre: 3 },
  { butsPour: 1, butsContre: 3 },
  { butsPour: 2, butsContre: 3 },
  { butsPour: 1, butsContre: 4 },
  { butsPour: 2, butsContre: 4 },
  { butsPour: 0, butsContre: 1 }, // défaite serrée fréquente → doublée
  { butsPour: 1, butsContre: 2 }, // idem
]

export function tirerScore(issue: Issue, rng: Rng): Score {
  // 1. On choisit la liste correspondant à l'issue.
  let liste: Score[]
  if (issue === 'victoire') liste = SCORES_VICTOIRE
  else if (issue === 'nul') liste = SCORES_NUL
  else liste = SCORES_DEFAITE

  // 2. Index aléatoire basé sur la taille RÉELLE de la liste (pas de nombre en dur).
  const i = Math.floor(rng() * liste.length)

  // 3. On renvoie le score tiré.
  return liste[i]
}
