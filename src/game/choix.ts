import type {
  Condition,
  Choice,
  ChoixResolu,
  EffetsJoueur,
  Forces,
  GameState,
  Jauges,
  Player,
  Pronostic,
} from './types'
import type { Rng } from './rng'

// Résout une "cible" de condition vers sa valeur réelle dans l'état du jeu.
// Périmètre v1 : cibles numériques de GameState (saison, reputation, jauge.xxx).
// Le championnat (porté par le Club, pas par GameState) sera ajouté plus tard.
function resoudreCible(cible: string, state: GameState): number {
  if (cible === 'saison') return state.saison
  if (cible === 'reputation') return state.reputation
  if (cible.startsWith('jauge.')) {
    const nom = cible.slice('jauge.'.length) // "jauge.vestiaire" → "vestiaire", donc comme ya plsr jauges on les selectionne par leur nom
    return state.jauges[nom as keyof Jauges] //as keyof juste pour rassurer le comppilateur que nom est bien un clee dans jauges
  }
  // Cible non reconnue = probable faute de frappe dans le JSON → on échoue tôt.
  throw new Error(`Cible de condition inconnue : ${cible}`)
}

// Vrai si la condition est satisfaite par l'état du jeu.
export function conditionRemplie(condition: Condition, state: GameState): boolean {
  const reelle = resoudreCible(condition.cible, state)//ducoup ici on prend la valeur de la cible ie la valeur de la variable sur laquelle on veut faire la compraison(vestiraire, saison, reputation etc) et on la compare avec la valeur de la condition  
  const seuil = Number(condition.valeur) // pour chaque condition on a une valeur de comparaison (exemple : 45 pour jauge.vestiaire < 45) pr savoir si on propose le choix
  switch (condition.op) {
    case '<':
      return reelle < seuil
    case '<=':
      return reelle <= seuil
    case '>':
      return reelle > seuil
    case '>=':
      return reelle >= seuil
    case '==':
      return reelle === seuil
    case '!=':
      return reelle !== seuil
    default:
      // Inatteignable si op respecte le type, mais protège contre un JSON invalide.
      throw new Error(`Opérateur inconnu : ${condition.op}`)
  }
}

// Garde uniquement les choix dont TOUTES les conditions sont remplies.
// Un choix sans condition est toujours éligible ([].every(...) === true) :
// c'est notre filet de sécurité (choix "fallback").
export function choixEligibles(choix: Choice[], state: GameState): Choice[] {
  return choix.filter((c) => c.conditions.every((cond) => conditionRemplie(cond, state)))
}

// Tire au hasard UN choix parmi les éligibles. Renvoie undefined si le vivier
// est vide (aucun choix ne colle à la situation) → l'appelant gère ce cas.
export function tirerChoix(eligibles: Choice[], rng: Rng): Choice | undefined {
  if (eligibles.length === 0) return undefined
  const i = Math.floor(rng() * eligibles.length)
  return eligibles[i]
}

// Applique les deltas d'une option aux jauges et renvoie de NOUVELLES jauges
// (fonction pure : on ne modifie pas l'objet reçu). Chaque jauge est bornée
// dans [0, 100]. Une jauge absente des effets ne bouge pas (delta 0).
export function appliquerEffetsJauges(jauges: Jauges, effets: Partial<Jauges>): Jauges {
  // Borne une valeur dans l'intervalle [0, 100].
  const borne = (v: number) => Math.max(0, Math.min(100, v))

  return {
    direction: borne(jauges.direction + (effets.direction ?? 0)),
    vestiaire: borne(jauges.vestiaire + (effets.vestiaire ?? 0)),
    fans: borne(jauges.fans + (effets.fans ?? 0)),
    tresorerie: borne(jauges.tresorerie + (effets.tresorerie ?? 0)),
  }
}

// Petit utilitaire : tire un joueur au hasard dans une liste (undefined si vide).
function tirerParmi(joueurs: Player[], rng: Rng): Player | undefined {
  if (joueurs.length === 0) return undefined
  return joueurs[Math.floor(rng() * joueurs.length)]
}

// Registre des rôles symboliques : chaque rôle sait comment choisir SON joueur
// dans l'effectif. C'est du contenu extensible : on ajoutera des rôles au besoin.
type SelecteurRole = (effectif: Player[], rng: Rng) => Player | undefined

const REGLES_ROLES: Record<string, SelecteurRole> = {
  // Un joueur pas tout à fait remis (statut "incertain").
  le_blesse: (effectif, rng) => tirerParmi(effectif.filter((p) => p.statut === 'incertain'), rng),
  // Un attaquant de pointe.
  titulaire_pointe: (effectif, rng) => tirerParmi(effectif.filter((p) => p.poste === 'A'), rng),
}

// Résout UNE FOIS, au tirage, les rôles utilisés par les options du choix, et
// mémorise quel vrai joueur correspond à chaque rôle (approche B : cohérence
// garantie entre le texte affiché et l'effet appliqué).
export function resoudreChoix(choix: Choice, effectif: Player[], rng: Rng): ChoixResolu {
  const cibles: Record<string, string> = {}

  for (const option of choix.options) {
    const role = option.effetsJoueur?.cible
    if (!role) continue // cette option ne vise aucun joueur
    if (cibles[role]) continue // rôle déjà résolu pour ce choix

    const regle = REGLES_ROLES[role]
    const joueur = regle ? regle(effectif, rng) : undefined
    if (joueur) cibles[role] = joueur.id // pas de candidat → rôle non mémorisé
  }

  return { choix, cibles }
}

// Applique l'effet d'une option sur le joueur figé pour ce rôle, et renvoie un
// NOUVEL effectif (fonction pure). moral/fraicheur sont des deltas bornés [0,100] ;
// forme/statut sont des remplacements. Si le rôle n'a pas de joueur, rien ne change.
export function appliquerEffetsJoueur(
  effectif: Player[],
  effets: EffetsJoueur,
  cibles: Record<string, string>,
): Player[] {
  const idCible = cibles[effets.cible]
  if (!idCible) return effectif // rôle non résolu (aucun candidat) → aucun changement

  const borne = (v: number) => Math.max(0, Math.min(100, v))

  return effectif.map((p) => {
    if (p.id !== idCible) return p // joueur non concerné → inchangé
    return {
      ...p, // on copie tout le joueur...
      moral: effets.moral !== undefined ? borne(p.moral + effets.moral) : p.moral,
      fraicheur: effets.fraicheur !== undefined ? borne(p.fraicheur + effets.fraicheur) : p.fraicheur,
      forme: effets.forme ?? p.forme, // remplacement si fourni
      statut: effets.statut ?? p.statut, // remplacement si fourni
    }
  })
}

// Applique les coefficients d'une option à nos forces (ex. choix offensif :
// attaque × 1.1). Fonction pure : renvoie de nouvelles forces.
export function appliquerEffetsForces(forces: Forces, effets: Partial<Forces>): Forces {
  // Coefficient par défaut = 1 (donc "× 1" = inchangé) si l'option ne touche pas ce secteur.
  let coefAttaque = 1
  if (effets.attaque !== undefined) {
    coefAttaque = effets.attaque
  }

  let coefDefense = 1
  if (effets.defense !== undefined) {
    coefDefense = effets.defense
  }

  // On construit les nouvelles forces à partir des coefficients.
  const nouvellesForces: Forces = {
    attaque: forces.attaque * coefAttaque,
    defense: forces.defense * coefDefense,
  }
  return nouvellesForces
}

// Rapproche les probabilités de l'équilibre 33/33/33 selon la variance.
// variance = 0  → rien ne change.
// variance = 1  → tout devient 1/3 (match totalement imprévisible).
// (Le cas "réduire la variance / accentuer le favori" sera traité plus tard.)
export function appliquerVariance(pronostic: Pronostic, variance: number): Pronostic {
  // On borne la variance dans [0, 1] pour rester dans un mélange valide.
  let v = variance
  if (v < 0) {
    v = 0
  }
  if (v > 1) {
    v = 1
  }

  // La valeur "équilibre" : un tiers pour chacune des trois issues.
  const tiers = 1 / 3

  // Chaque probabilité se rapproche du tiers : on garde (1 - v) de l'ancienne
  // valeur et on ajoute v fois l'équilibre. (Même formule pour les trois.)
  const nouveauPronostic: Pronostic = {
    victoire: pronostic.victoire * (1 - v) + tiers * v,
    nul: pronostic.nul * (1 - v) + tiers * v,
    defaite: pronostic.defaite * (1 - v) + tiers * v,
  }
  return nouveauPronostic
}
