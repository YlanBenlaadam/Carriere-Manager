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

// Construit le classement du championnat en tenant compte des résultats RÉELS du
// joueur (ses matchs clés), le reste des rencontres étant simulé automatiquement.
// resultatsJoueur : nos résultats, chacun avec notre club en "domicile".
export function classementAvecResultatsJoueur(
  clubIds: string[],
  monClubId: string,
  resultatsJoueur: ResultatRencontre[],
  effectifsParClub: Record<string, Player[]>,
  rng: Rng,
): LigneClassement[] {
  // On indexe nos résultats par adversaire : adversaire → (nos buts, leurs buts).
     /*
      parAdversaire[r.exterieur] -> signifie que l'on associe à l'identifiant du club adverse (r.exterieur) un objet contenant nos buts et leurs buts pour ce match.
       Cela permet de retrouver rapidement le résultat d'un match joué contre un adversaire spécifique.
      Exemple : si notre club a joué contre "clubA" et a marqué 2 buts tandis que "clubA" en a marqué 1, 
      alors parAdversaire["clubA"] sera { nosButs: 2, leursButs: 1 }.
    */
  const parAdversaire: Record<string, { nosButs: number; leursButs: number }> = {}
  for (const r of resultatsJoueur) {
    // Par construction, r.domicile est notre club ; l'adversaire est r.exterieur.
    parAdversaire[r.exterieur] = { nosButs: r.butsDomicile, leursButs: r.butsExterieur }
 
  }

  // On parcourt tout le calendrier. Pour chaque rencontre, deux cas :
  //  - c'est un de NOS matchs déjà joués → on réutilise notre résultat réel ;
  //  - sinon → on simule la rencontre.
  // explication du if : Si le club à domicile est notre club ET 
  // que nous avons un résultat enregistré contre l'adversaire (le club à l'extérieur), 
  // alors nous utilisons notre résultat réel. 
  // Sinon, si le club à l'extérieur est notre club 
  // ET que nous avons un résultat enregistré contre l'adversaire (le club à domicile), alors nous utilisons également notre résultat réel. 
  // Dans tous les autres cas, nous simulons la rencontre.
  const rencontres = genererCalendrier(clubIds)
  const resultats: ResultatRencontre[] = []
  for (const f of rencontres) {
    if (f.domicile === monClubId && parAdversaire[f.exterieur] !== undefined) {
      // Notre club est à domicile dans cette rencontre : orientation directe.
      const mien = parAdversaire[f.exterieur]
      resultats.push({
        domicile: f.domicile,
        exterieur: f.exterieur,
        butsDomicile: mien.nosButs,
        butsExterieur: mien.leursButs,
      })
    } else if (f.exterieur === monClubId && parAdversaire[f.domicile] !== undefined) {
      // Notre club est à l'extérieur : on INVERSE (nos buts côté extérieur).
      const mien = parAdversaire[f.domicile]
      resultats.push({
        domicile: f.domicile,
        exterieur: f.exterieur,
        butsDomicile: mien.leursButs,
        butsExterieur: mien.nosButs,
      }) // ici on passe dans le cas des matchs non jouer donc on simule le match
    } else {
      resultats.push(simulerRencontre(f, effectifsParClub, rng))
    }
  }

  return calculerClassement(resultats)
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
  rng: Rng,
): Bilan {
  // Rang réel : position du club dans le classement (liste d'ids dans l'ordre).
  // en gros ici on recupere le classement reel du club du joueur et on recupere son rang dans le classement
  // donc id classes = on recupere le classement entier du championnat
  // et rangReel = on recupere le rang du club du joueur dans le classement reel
  // rq -> on pourrait juste stocker le classement dans idclasses mais 
  // Cette ligne .map((ligne) => ligne.clubId) signifie que l'on parcourt chaque élément du tableau classementReel et
  //  que l'on extrait la propriété clubId de chaque élément.
  const idsClasses = classementReel.map((ligne) => ligne.clubId)
  const rangReel = rangDe(idsClasses, clubId)

  // Rang attendu : position du club si on classe tout le monde par force.
  const rangAttendu = rangDe(classementAttendu(forcesParClub), clubId)

  // Note à partir de l'écart entre les deux rangs (par paliers + un peu de hasard).
  const note = noteSurperformance(rangReel, rangAttendu, rng)

  // Licencié dès qu'UNE jauge atteint 0 (règle v1 : licenciement = fin de carrière).
  const licencie =
    jauges.direction <= 0 ||
    jauges.vestiaire <= 0 ||
    jauges.fans <= 0 ||
    jauges.tresorerie <= 0

  return { rangReel, rangAttendu, note, licencie }
}
