import type { Pronostic, Issue } from './types'
import type { Rng } from './rng'
import { calculerForces } from './force'
import { calculerPronostic } from './pronostic'
import { tirerScore } from './score'
import { genererNotes } from './notes'
import { appliquerEffetsForces, appliquerVariance } from './choix'
import type { Player, MatchResult, Option } from './types'


  /* ici on est  comme sur une regle graduer :
       . victtoire - Nul - Defaite
       . Donc si on a pas gagner car c trop petit la proba on ajoute la probabbilite du nul car p(nul) = probaVictoire + probaNul
       . Exemple pour un pronostic de 0.45 victoire, 0.3 nul et 0.25 defaite
       . Donc si on tire un nombre aléatoire entre 0 et 1, si c inferieur a 0.45 on gagne, si c inferieur a 0.75 on fait nul et sinon on perd
   
0 ───── victoire ─────┤───── nul ─────┤───── defaite ─────► 1  
0                   0.45            0.75                  1
*/

export function tirerIssue(pronostic: Pronostic, rng: Rng): Issue {
  const r = rng() // flottant dans [0, 1)
  if(r < pronostic.victoire){
    return 'victoire';
  
  }else if(r < pronostic.victoire + pronostic.nul) {
    return 'nul';
  }else{
    return 'defaite';   
  }
}


// Joue un match en tenant compte (éventuellement) de l'option choisie par le
// joueur AVANT le coup d'envoi.
//
// Déroulé d'un match clé (rappel du cahier des charges) :
//   forces → pronostic → [le choix modifie forces/variance] → tirage → notes.
//
// L'option peut agir sur deux leviers :
//   - effetsForces  : multiplie NOS forces (ex. tactique offensive, attaque × 1.1)
//   - effetsVariance: rend le résultat plus (ou moins) imprévisible
// Si aucune option n'a été présentée ce match-ci, on passe `undefined` : le match
// se joue alors sans aucune modification.
export function jouerMatchAvecOption(
  nos: Player[],
  adverses: Player[],
  option: Option | undefined,
  rng: Rng,
): MatchResult {
  // 1) Forces de base des deux équipes, calculées depuis les titulaires.
  //    Les forces adverses ne bougent jamais ici → une const.
  const adversesForces = calculerForces(adverses)
  //    Les nôtres peuvent être modifiées par l'option juste après → un let.
  let nosForces = calculerForces(nos)

  // 2) Si une option a été choisie ET qu'elle touche les forces, on applique ses
  //    coefficients à NOS forces (ex. attaque × 1.1). Les deux conditions sont
  //    nécessaires : pas d'option du tout, ou une option qui ne touche pas les
  //    forces → on garde nos forces de base.
  if (option !== undefined && option.effetsForces !== undefined) {
    nosForces = appliquerEffetsForces(nosForces, option.effetsForces)
  }

  // 3) Pronostic calculé à partir des forces (déjà modifiées si l'option l'a fait).
  //    `let` car la variance, juste en dessous, peut encore le retoucher.
  let pronostic = calculerPronostic(nosForces, adversesForces)

  // 4) Si l'option touche la variance, on rapproche plus ou moins le pronostic de
  //    l'équilibre 33/33/33 : plus de variance = résultat plus imprévisible
  //    (l'outsider a davantage sa chance).
  if (option !== undefined && option.effetsVariance !== undefined) {
    pronostic = appliquerVariance(pronostic, option.effetsVariance)
  }

  // 5) On tire l'issue (victoire / nul / défaite) à partir du pronostic FINAL
  //    (forces et variance déjà appliquées), puis un score cohérent avec l'issue.
  const issue = tirerIssue(pronostic, rng)
  const score = tirerScore(issue, rng)

  // 6) On génère les notes des joueurs à partir du score obtenu.
  const notes = genererNotes(nos, score, rng)

  // 7) On assemble le résultat. Le `pronostic` renvoyé est bien celui qui a servi
  //    au tirage (donc forces + variance incluses), pas le pronostic de base.
  return {
    butsPour: score.butsPour,
    butsContre: score.butsContre,
    pronostic,
    notes,
  }
}

// Joue un match SANS choix (cas simple). On réutilise jouerMatchAvecOption en lui
// passant `undefined` comme option : ni les forces ni la variance ne sont touchées.
// Ça évite de dupliquer toute la logique du match à deux endroits.
export function jouerMatch(nos: Player[], adverses: Player[], rng: Rng): MatchResult {
  return jouerMatchAvecOption(nos, adverses, undefined, rng)
}