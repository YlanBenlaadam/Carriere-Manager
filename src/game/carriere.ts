import type { GameState, Player, Bilan, Trophee, BilanSaison, Club } from './types'
import type { Rng } from './rng'
import { faireVieillirEffectif } from './progression'

// Réputation de départ : basse, on débute sa carrière d'entraîneur.
const REPUTATION_DEPART = 30

// Réglages de carrière (à affiner au playtest) :
const SAISONS_MAX = 5 // la carrière se termine au bout de 5 saisons...
const REPUTATION_PAR_POINT = 3 // ...la réputation bouge de 3 par point de note au-dessus/sous la moyenne (5.5)
const MAX_OFFRES = 3 // nombre d'offres proposées à l'intersaison
const TAILLE_VIVIER = 6 // on pioche les offres parmi les N clubs les plus proches en niveau

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

// Génère les offres d'embauche de fin de saison. On propose surtout des clubs de
// NIVEAU COMPARABLE au club actuel (étoiles similaires), avec une cible légèrement
// tirée vers le haut/bas selon la réputation (bonne saison = clubs un peu plus gros).
// On garantit toujours au moins une offre d'un cran AU-DESSUS (progression).
export function genererOffres(
  reputation: number,
  clubActuelId: string,
  tousLesClubs: Club[],
  rng: Rng,
): Club[] {
  const clubActuel = tousLesClubs.find((c) => c.id === clubActuelId)
  // Niveau visé : le prestige du club actuel, nudgé par la réputation (au-dessus de
  // 50 ça tire vers le haut, en dessous vers le bas, légèrement).
  const base = clubActuel !== undefined ? clubActuel.prestige : 50
  const niveauCible = base + (reputation - 50) * 0.2

  // On trie les autres clubs du PLUS PROCHE au plus éloigné de ce niveau visé
  // (Math.abs = distance, sans le signe) → les "étoiles similaires" d'abord.
  const autres = tousLesClubs.filter((c) => c.id !== clubActuelId)
  const parProximite = [...autres].sort(
    (a, b) => Math.abs(a.prestige - niveauCible) - Math.abs(b.prestige - niveauCible),
  )

  // On garde un vivier des plus proches, on le mélange (Fisher-Yates), puis on prend
  // MAX_OFFRES. Ainsi on a toujours plusieurs offres de niveau comparable.
  const vivier = parProximite.slice(0, TAILLE_VIVIER)
  for (let i = vivier.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = vivier[i]
    vivier[i] = vivier[j]
    vivier[j] = temp
  }

  const offres = vivier.slice(0, MAX_OFFRES)

  // PROGRESSION : on garantit toujours au moins une offre d'un club PLUS prestigieux
  // que le club actuel (le cran juste au-dessus, le plus accessible), pour qu'on
  // puisse grimper même en partant d'un petit club. (clubActuel est défini plus haut.)
  if (clubActuel !== undefined) {
    const dejaUnePlusGrosse = offres.some((o) => o.prestige > clubActuel.prestige)
    if (!dejaUnePlusGrosse) {
      // Les clubs plus prestigieux, triés du moins au plus prestigieux : on prend
      // le premier = le cran juste au-dessus.
      const plusGros = tousLesClubs
        .filter((c) => c.id !== clubActuelId && c.prestige > clubActuel.prestige)
        .sort((a, b) => a.prestige - b.prestige)
      if (plusGros.length > 0) {
        const cranAuDessus = plusGros[0]
        if (offres.length < MAX_OFFRES) {
          offres.push(cranAuDessus)
        } else {
          // Plus de place : on remplace la dernière offre (la moins intéressante).
          offres[offres.length - 1] = cranAuDessus
        }
      }
    }
  }

  return offres
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
