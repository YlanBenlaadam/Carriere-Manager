import type { Forces, Pronostic } from './types'

export function calculerPronostic(nous: Forces, adversaire: Forces): Pronostic {
  // Avantage net : "mon attaque passe-t-elle sa défense" + "ma défense tient-elle face à son attaque".
  // > 0 = on est favori, < 0 = outsider, = 0 = équilibré.
  const avantage = (nous.attaque - adversaire.defense) + (nous.defense - adversaire.attaque)

  // On range le match dans une tranche, de la plus favorable à la moins favorable.
  // L'ordre décroissant + le return immédiat font que la première tranche qui
  // correspond l'emporte. Chaque ligne a une somme victoire+nul+defaite = 1.
  if (avantage >= 40) return { victoire: 0.8, nul: 0.15, defaite: 0.05 } // grand favori
  else if (avantage >= 20) return { victoire: 0.6, nul: 0.25, defaite: 0.15 } // favori net
  else if (avantage >= 5) return { victoire: 0.45, nul: 0.3, defaite: 0.25 } // léger favori
  else if (avantage > -5) return { victoire: 0.33, nul: 0.34, defaite: 0.33 } // équilibré
  else if (avantage > -20) return { victoire: 0.25, nul: 0.3, defaite: 0.45 } // léger outsider
  else if (avantage > -40) return { victoire: 0.15, nul: 0.25, defaite: 0.6 } // outsider net
  else return { victoire: 0.05, nul: 0.15, defaite: 0.8 } // gros outsider
}
