import type {
  Player,
  Rencontre,
  ResultatRencontre,
  LigneClassement,
  Jauges,
  Bilan,
} from './types'
import type { Rng } from './rng'
import { meilleurOnze } from './compo'
import { calculerForces } from './force'
import { jouerMatch } from './match'
import { genererCalendrier } from './calendrier'
import { calculerClassement } from './classement'
import { classementAttendu, rangDe, noteSurperformance } from './surperformance'

// Force "globale" d'un club = moyenne de l'attaque et de la défense de son meilleur
// XI. Sert au classement ATTENDU (clubs triés par force).
// Rappel : calculerForces (force.ts) renvoie des Forces = { attaque, defense }.
export function forceGlobale(effectif: Player[]): number {
  const xi = meilleurOnze(effectif)
  const forces = calculerForces(xi)
  return (forces.attaque + forces.defense) / 2
}

// Simule UNE rencontre automatiquement et renvoie son résultat.
// Rappel des types (types.ts) :
//   - Rencontre        = { domicile, exterieur }                 (ids des clubs)
//   - ResultatRencontre = { domicile, exterieur, butsDomicile, butsExterieur }
// effectifsParClub = dictionnaire { idDuClub: ses joueurs }.
export function simulerRencontre(
  rencontre: Rencontre,
  effectifsParClub: Record<string, Player[]>,
  rng: Rng,
): ResultatRencontre {
  const xiDomicile = meilleurOnze(effectifsParClub[rencontre.domicile])
  const xiExterieur = meilleurOnze(effectifsParClub[rencontre.exterieur])

  // jouerMatch renvoie un MatchResult du point de vue du 1er argument. On met donc
  // le club "à domicile" en premier → ses buts = butsPour, ceux du visiteur = butsContre.
  const resultat = jouerMatch(xiDomicile, xiExterieur, rng)

  return {
    domicile: rencontre.domicile,
    exterieur: rencontre.exterieur,
    butsDomicile: resultat.butsPour,
    butsExterieur: resultat.butsContre,
  }
}

// Simule TOUT le championnat (toutes les rencontres) et calcule le classement.
export function simulerSaison(
  clubIds: string[],
  effectifsParClub: Record<string, Player[]>,
  rng: Rng,
): { resultats: ResultatRencontre[]; classement: LigneClassement[] } {
  // 1) On génère le calendrier (chaque club affronte chaque autre une fois).
  const rencontres = genererCalendrier(clubIds)

  // 2) On joue chaque rencontre et on accumule les résultats.
  const resultats: ResultatRencontre[] = []
  for (const rencontre of rencontres) {
    resultats.push(simulerRencontre(rencontre, effectifsParClub, rng))
  }

  // 3) On en déduit le classement final.
  const classement = calculerClassement(resultats)

  return { resultats, classement }
}

// Fait le bilan de fin de saison pour LE club du joueur : compare son rang réel au
// rang attendu (→ note de surperformance) et vérifie s'il est licencié.
// Rappel : LigneClassement (types.ts) a un champ clubId ; Jauges a direction,
// vestiaire, fans, tresorerie.
export function faireBilan(
  clubId: string,
  classementReel: LigneClassement[],
  forcesParClub: Record<string, number>,
  jauges: Jauges,
): Bilan {
  // Rang réel : position du club dans le classement (liste d'ids dans l'ordre).
  const idsClasses = classementReel.map((ligne) => ligne.clubId)
  const rangReel = rangDe(idsClasses, clubId)

  // Rang attendu : position du club si on classe tout le monde par force.
  const rangAttendu = rangDe(classementAttendu(forcesParClub), clubId)

  // Note de surperformance à partir de l'écart entre les deux rangs.
  const note = noteSurperformance(rangReel, rangAttendu)

  // Licencié dès qu'UNE jauge atteint 0 (règle v1 : licenciement = fin de carrière).
  const licencie =
    jauges.direction <= 0 ||
    jauges.vestiaire <= 0 ||
    jauges.fans <= 0 ||
    jauges.tresorerie <= 0

  return { rangReel, rangAttendu, note, licencie }
}
