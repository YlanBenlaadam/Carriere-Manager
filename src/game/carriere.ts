import type { GameState, Player, Bilan, Trophee, BilanSaison, Club } from './types'
import type { Rng } from './rng'
import { faireVieillirEffectif } from './progression'

// Réputation de départ : basse, on débute sa carrière d'entraîneur.
const REPUTATION_DEPART = 30

// Réglages de carrière (à affiner au playtest) :
const SAISONS_MAX = 5 // la carrière se termine au bout de 5 saisons...
const REPUTATION_PAR_POINT = 3 // ...la réputation bouge de 3 par point de note au-dessus/sous la moyenne (5.5)
const OFFRE_MARGE_HAUT = 10 // on peut recevoir des offres de clubs jusqu'à 10 de prestige AU-DESSUS de sa réputation
const OFFRE_MARGE_BAS = 15 // ...et jusqu'à 15 EN DESSOUS
const MAX_OFFRES = 3 // nombre maximum d'offres proposées

/** Ce que renvoie la fin de saison : le nouvel état + si la carrière est finie. */
export interface ResultatFinSaison {
  etat: GameState
  finie: boolean
  raison: 'licencie' | 'fin_carriere' | null
}

// Crée l'état initial d'une nouvelle partie pour le club choisi.
// - jauges toutes à 50 (neutre)
// - saison 1, réputation basse
// - effectif = une COPIE de celui du club (pour ne pas partager la référence des
//   données sources ; nos fonctions renvoient de toute façon de nouveaux objets)
// - historique et palmarès vides
export function creerPartie(clubId: string, effectif: Player[], seed: number): GameState {
  return {
    seed,
    saison: 1,
    clubId,
    jauges: { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 },
    effectif: [...effectif],
    historique: [],
    palmares: [],
    reputation: REPUTATION_DEPART,
  }
}

// Termine la saison en cours et renvoie l'état pour la suivante (ou la fin de
// carrière). Fonction pure : on construit un nouvel état, sans modifier l'ancien.
// - bilan            : le bilan de la saison (rangs, note, licencié ?)
// - tropheesGagnes   : les trophées remportés cette saison (championnat, coupes...)
export function terminerSaison(
  state: GameState,
  bilan: Bilan,
  tropheesGagnes: Trophee[],
): ResultatFinSaison {
  // 1) On archive la saison dans l'historique de carrière.
  const memoire: BilanSaison = {
    saison: state.saison,
    clubId: state.clubId,
    rangReel: bilan.rangReel,
    rangAttendu: bilan.rangAttendu,
    note: bilan.note,
  }
  const historique = [...state.historique, memoire]

  // 2) On ajoute les trophées de la saison au palmarès.
  const palmares = [...state.palmares, ...tropheesGagnes]

  // 3) Les joueurs prennent un an (jeunes qui progressent, vétérans qui déclinent).
  const effectif = faireVieillirEffectif(state.effectif)

  // 4) La réputation bouge selon la note : au-dessus de 5.5 elle monte, en dessous
  //    elle baisse. On la garde dans [0, 100].
  const deltaReputation = Math.round((bilan.note - 5.5) * REPUTATION_PAR_POINT)
  let reputation = state.reputation + deltaReputation
  if (reputation < 0) {
    reputation = 0
  }
  if (reputation > 100) {
    reputation = 100
  }

  // 5) La carrière se termine-t-elle ? Licencié (jauge à 0) ou 5 saisons atteintes.
  let finie = false
  let raison: 'licencie' | 'fin_carriere' | null = null
  if (bilan.licencie) {
    finie = true
    raison = 'licencie'
  } else if (state.saison >= SAISONS_MAX) {
    finie = true
    raison = 'fin_carriere'
  }

  // 6) Si on continue, on passe à la saison suivante ; sinon on garde le compteur.
  const saison = finie ? state.saison : state.saison + 1

  // Les jauges sont conservées d'une saison à l'autre (ta standing avec le board,
  // les fans... persiste). Elles évoluent pendant la saison, pas à ce moment-ci.
  const etat: GameState = {
    ...state,
    saison,
    effectif,
    historique,
    palmares,
    reputation,
  }

  return { etat, finie, raison }
}

// Génère les offres d'embauche de fin de saison : les clubs dont le prestige est
// proche de la réputation du coach (un peu au-dessus, un peu en dessous). Plus la
// réputation est haute, plus les clubs proposés sont prestigieux.
export function genererOffres(
  reputation: number,
  clubActuelId: string,
  tousLesClubs: Club[],
  rng: Rng,
): Club[] {
  // On garde les clubs dans la "fourchette" de réputation, en excluant le club actuel.
  const eligibles = tousLesClubs.filter((club) => {
    const dansLaFourchette =
      club.prestige <= reputation + OFFRE_MARGE_HAUT &&
      club.prestige >= reputation - OFFRE_MARGE_BAS
    return club.id !== clubActuelId && dansLaFourchette
  })

  // On mélange la liste (algorithme de Fisher-Yates) pour tirer des offres au hasard,
  // puis on garde les premières. Le mélange : on part de la fin et on échange chaque
  // case avec une case tirée au hasard parmi celles d'avant (elle incluse).
  const melange = [...eligibles]
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = melange[i]
    melange[i] = melange[j]
    melange[j] = temp
  }

  return melange.slice(0, MAX_OFFRES)
}

// Le coach accepte une offre : il change de club. On repart avec le nouvel effectif
// et des jauges neuves (nouveau départ), mais la réputation, le palmarès et
// l'historique de carrière sont conservés. Fonction pure.
export function accepterOffre(
  state: GameState,
  nouveauClubId: string,
  nouvelEffectif: Player[],
): GameState {
  return {
    ...state,
    clubId: nouveauClubId,
    effectif: [...nouvelEffectif],
    jauges: { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 },
  }
}
