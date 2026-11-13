import type { Issue, Jauges } from './types'
import { appliquerEffetsJauges } from './choix'

// Ce que chaque résultat de match fait bouger sur les jauges (réglage à affiner).
// Volontairement DOUX : une seule défaite ne doit pas licencier. Le gros levier
// sera le bilan de fin de saison (surperformance). Seuls "fans" et "direction"
// réagissent aux résultats ; "vestiaire" (gestion humaine) et "tresorerie"
// (primes/choix) évoluent ailleurs.
const DELTAS_RESULTAT: Record<Issue, Partial<Jauges>> = {
  victoire: { fans: 4, direction: 3 },
  nul: { fans: -1 },
  defaite: { fans: -4, direction: -3 },
}

// Applique l'effet d'un résultat (victoire/nul/défaite) sur les jauges du club.
// On réutilise appliquerEffetsJauges, donc le bornage dans [0, 100] est déjà géré.
export function appliquerResultatAuxJauges(jauges: Jauges, issue: Issue): Jauges {
  const deltas = DELTAS_RESULTAT[issue]
  return appliquerEffetsJauges(jauges, deltas)
}
