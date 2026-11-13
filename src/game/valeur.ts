import type { Player } from './types'

// Estime la VALEUR MARCHANDE d'un joueur (en M€), dérivée à la demande (on ne la
// stocke pas dans Player). Sert au mercato. Tous les coefficients sont du réglage
// à affiner au playtest.
//
// 4 facteurs : niveau (principal), âge, potentiel (upside des jeunes), contrat.
export function estimerValeur(player: Player, saisonActuelle: number): number {
  // 1) Base selon le niveau, non-linéaire : un crack vaut DISPROPORTIONNÉMENT plus
  //    qu'un joueur moyen. (niveau 30 → 0 ; 70 → ~64 ; 90 → ~144.)
  const ecartAuPlancher = player.niveau - 30
  let valeur = ecartAuPlancher * ecartAuPlancher * 0.04

  // 2) Coefficient d'âge : un joueur dans la force de l'âge vaut plein pot, un
  //    vétéran beaucoup moins, un très jeune un peu plus (promesse).
  let coefAge = 1
  if (player.age <= 22) {
    coefAge = 1.1
  } else if (player.age <= 29) {
    coefAge = 1
  } else if (player.age <= 32) {
    coefAge = 0.7
  } else {
    coefAge = 0.4
  }
  valeur = valeur * coefAge

  // 3) Bonus "upside" pour un jeune (< 23 ans) qui a encore de la marge de
  //    progression : plus l'écart niveau→potentiel est grand, plus il vaut cher.
  if (player.age < 23) {
    const marge = player.potentiel - player.niveau
    valeur = valeur * (1 + marge / 100)
  }

  // 4) Coefficient de contrat : un joueur en fin de contrat coûte moins cher
  //    (il peut partir bientôt). On regarde combien de saisons il reste.
  const saisonsRestantes = player.finContrat - saisonActuelle
  let coefContrat = 1
  if (saisonsRestantes <= 0) {
    coefContrat = 0.2 // contrat fini / dernière saison : quasi libre
  } else if (saisonsRestantes === 1) {
    coefContrat = 0.6
  } else {
    coefContrat = 1
  }
  valeur = valeur * coefContrat

  // Arrondi à l'entier (M€), avec un minimum de 1 (un joueur vaut toujours un peu).
  const valeurFinale = Math.max(1, Math.round(valeur))
  return valeurFinale
}
