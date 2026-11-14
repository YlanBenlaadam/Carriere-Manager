// ============================================================================
//  types.ts — Le modèle de données du jeu.
//  UNIQUEMENT des définitions de types (aucun code exécuté à l'exécution).
//  Tout le reste du code importera ses types d'ici : source unique de vérité.
// ============================================================================

// ----------------------------------------------------------------------------
//  1. Unions de base (des valeurs autorisées, listées une fois pour toutes)
//     Un "type X = 'a' | 'b'" veut dire : X ne peut valoir QUE 'a' ou 'b'.
//     Si tu écris autre chose, le compilateur refuse. C'est ta sécurité.
// ----------------------------------------------------------------------------

/** Poste sur le terrain : Gardien, Défenseur, Milieu, Attaquant. */
export type Poste = 'G' | 'D' | 'M' | 'A'

/** Disponibilité d'un joueur.
 *  - 'apte'      : jouable normalement
 *  - 'incertain' : jouable, mais risque de rechute (déclenche un choix)
 *  - 'blesse'    : NON titularisable */
export type Statut = 'apte' | 'incertain' | 'blesse'

/** Dynamique récente du joueur : +1 = en forme (boost), -1 = méforme (malus).
 *  Se met à jour automatiquement selon les dernières perfs. */
export type Forme = 1 | -1

/** Les 5 grands championnats. On se limite à la 1re division de chacun
 *  (pas de 2e/3e division) pour ne pas avoir trop d'équipes à gérer. */
export type Championnat =
  | 'France'
  | 'Angleterre'
  | 'Espagne'
  | 'Italie'
  | 'Allemagne'

/** Les 4 jauges opposées. Utile pour désigner une jauge dans le mini-langage. */
export type Jauge = 'direction' | 'vestiaire' | 'fans' | 'tresorerie'

/** Les 4 familles de choix forts proposés avant un match. */
export type FamilleChoix =
  | 'composition'
  | 'tactique'
  | 'gestion_humaine'
  | 'contexte'

// ----------------------------------------------------------------------------
//  2. Le joueur.
//     Rappel du vocabulaire STRICT :
//       niveau = capacité, /100, stable  (≠)  note = perf d'un match, /10
//     La "valeur" marchande n'est PAS stockée ici : on la DÉRIVE quand le
//     mercato en a besoin, via une fonction estimerValeur(player) à venir.
// ----------------------------------------------------------------------------

export interface Player {
  id: string
  prenom: string
  nom: string
  age: number
  poste: Poste

  niveau: number // 0-100, capacité stable du joueur
  potentiel: number // 0-100, plafond qu'il peut atteindre en progressant
  mental: number // 0-100, VISIBLE : aide le joueur à estimer le risque

  forme: Forme // +1 / -1 (subie : conséquence des résultats)
  fraicheur: number // 0-100, baisse avec les matchs, remonte au repos
  moral: number // 0-100, piloté par tes choix de gestion humaine

  statut: Statut // apte / incertain / blesse
  finContrat: number // n° de la saison où le contrat se termine
}

// ----------------------------------------------------------------------------
//  3. Le club (données réelles : nom uniquement, jamais logo/maillot).
//     prestige ≠ budget : réputation (narratif, offres) vs argent (mercato).
// ----------------------------------------------------------------------------

/** Couleurs du club, pour générer nos pastilles (pas de vrai écusson). */
export interface Couleurs {
  principale: string // hex, ex. "#c8102e"
  secondaire: string // hex, ex. "#ffffff"
}

export interface Club {
  id: string
  nom: string
  championnat: Championnat
  prestige: number // 0-100, réputation du club
  budget: number // en unité monétaire du jeu
  couleurs: Couleurs
}

// ----------------------------------------------------------------------------
//  4. Les jauges vivantes du jeu (0-100). Une jauge à 0 = licencié.
// ----------------------------------------------------------------------------

export interface Jauges {
  direction: number
  vestiaire: number
  fans: number
  tresorerie: number
}

// ----------------------------------------------------------------------------
//  5. Le mini-langage déclaratif des CHOIX (vit en JSON, donc 100% data).
//     - conditions : quand ce choix a le droit d'apparaître
//     - effets     : ce qu'une option modifie une fois cliquée
//     Les fonctions qui LISENT ce langage (le moteur) seront du code, ailleurs.
// ----------------------------------------------------------------------------

/** Opérateurs de comparaison autorisés dans une condition. */
export type OperateurCondition = '<' | '<=' | '>' | '>=' | '==' | '!='

/** Une condition teste une valeur de l'état du jeu.
 *  Exemples de "cible" : "jauge.vestiaire", "saison", "reputation", "championnat".
 *  Toutes les conditions d'un choix doivent être vraies pour qu'il apparaisse. */
export interface Condition {
  cible: string
  op: OperateurCondition
  valeur: number | string
}

/** Effet ciblant UN joueur, désigné par un rôle symbolique résolu par le
 *  moteur au moment du choix (ex. "titulaire_pointe", "cadre_en_conflit",
 *  "le_blesse"). Les champs absents ne changent pas. */
export interface EffetsJoueur {
  cible: string
  moral?: number // delta appliqué au moral
  forme?: Forme // force une nouvelle forme
  fraicheur?: number // delta appliqué à la fraîcheur
  statut?: Statut // ex. passe à 'blesse' en cas de rechute
}

/** Une option cliquable d'un choix. Tous les effets sont optionnels.
 *  - effetsJauges   : deltas sur les jauges (peut monter l'une, baisser l'autre)
 *  - effetsForces   : MULTIPLICATEURS sur la force d'équipe (1.1 = +10%)
 *  - effetsVariance : delta sur la variance du match (+ = plus risqué)
 *  - effetsJoueur   : effet ciblé sur un joueur */
export interface Option {
  texte: string
  effetsJauges?: Partial<Jauges>
  effetsForces?: Partial<Forces>
  effetsVariance?: number
  effetsJoueur?: EffetsJoueur
}

/** Un choix fort, tel qu'écrit dans les fichiers JSON de contenu. */
export interface Choice {
  id: string
  famille: FamilleChoix
  conditions: Condition[]
  texte: string
  options: Option[]
}

/** Un choix tiré, avec les joueurs concrets associés à ses rôles symboliques.
 *  Les rôles sont figés AU TIRAGE pour garder texte et effets cohérents. */
export interface ChoixResolu {
  choix: Choice
  cibles: Record<string, string> // nom du rôle (ex. "le_blesse") → id du joueur
}

// ----------------------------------------------------------------------------
//  6. Le match : pronostic affiché puis résultat tiré.
// ----------------------------------------------------------------------------

/** Probabilités affichées AVANT le match. Somme attendue = 1. */
export interface Pronostic {
  victoire: number
  nul: number
  defaite: number
}

/** Résultat d'un match, du point de vue de notre équipe. */
export type Issue = 'victoire' | 'nul' | 'defaite'

/** Un score de match, du point de vue de notre équipe. */
export interface Score {
  butsPour: number
  butsContre: number
}

/** Une rencontre de championnat : deux clubs (identifiés par leur id) s'affrontent.
 *  domicile/exterieur serviront plus tard si on ajoute l'avantage du terrain. */
export interface Rencontre {
  domicile: string
  exterieur: string
}

/** Le résultat d'une rencontre une fois jouée (buts de chaque côté). */
export interface ResultatRencontre {
  domicile: string
  exterieur: string
  butsDomicile: number
  butsExterieur: number
}

/** Une ligne du classement d'un club (bilan de ses matchs sur la saison). */
export interface LigneClassement {
  clubId: string
  points: number
  joues: number
  gagnes: number
  nuls: number
  perdus: number
  butsPour: number
  butsContre: number
  difference: number // butsPour - butsContre
}

/** Le bilan de fin de saison pour le club du joueur. */
export interface Bilan {
  rangReel: number // position réelle au classement
  rangAttendu: number // position attendue vu la force de l'effectif
  note: number // note de surperformance /10
  licencie: boolean // true si une jauge est tombée à 0
}

/** Les coupes d'Europe (selon le niveau du club). */
export type CompetitionEurope = 'ldc' | 'europa'

/** Une compétition à élimination directe dont on joue la finale. */
export type Competition = 'coupe_nationale' | 'ldc' | 'europa'

/** Les types de trophées que le joueur peut remporter au cours de sa carrière.
 *  'championnat' = titre de champion (finir 1er du championnat). */
export type TypeTrophee = 'championnat' | 'coupe_nationale' | 'ldc' | 'europa'

/** Un trophée gagné : quelle compétition, quelle saison. */
export interface Trophee {
  saison: number
  competition: TypeTrophee
}

/** Le palmarès = la liste des trophées accumulés sur toute la carrière. */
export type Palmares = Trophee[]

/** Les statistiques individuelles d'un match : la note de chaque joueur, et qui
 *  a marqué / fait une passe décisive. Chaque Record associe un id de joueur à
 *  un nombre (note /10, nombre de buts, nombre de passes). */
export interface StatsMatch {
  notes: Record<string, number> // id du joueur → sa note /10
  buteurs: Record<string, number> // id du joueur → nombre de buts marqués
  passeurs: Record<string, number> // id du joueur → nombre de passes décisives
}

/** Résultat d'un match clé, du point de vue de NOTRE équipe. */
export interface MatchResult {
  butsPour: number
  butsContre: number
  pronostic: Pronostic
  notes: Record<string, number> // clé = Player.id, valeur = note /10 du match
  buteurs: Record<string, number> // id du joueur → nombre de buts
  passeurs: Record<string, number> // id du joueur → nombre de passes décisives
}

// ----------------------------------------------------------------------------
//  7. PLACEHOLDERS PROVISOIRES — inventés juste pour que GameState compile.
//     À co-concevoir quand on construira ces systèmes. N'hésite pas à les
//     challenger : ce ne sont pas des décisions figées.
// ----------------------------------------------------------------------------

/** Force d'une équipe. Provisoire : on décidera ensemble si la force est
 *  UN seul nombre ou une paire attaque/défense (au design de calculerForce).
 *  const f = { attaque: 60, defense: 50 } -> en gros la variable F c'est une boite qui contien 2 entier 
 * */
export interface Forces {
  attaque: number
  defense: number
}

/** Mémoire d'une saison écoulée, pour l'historique de carrière. */
export interface BilanSaison {
  saison: number
  clubId: string
  rangReel: number
  rangAttendu: number
  note: number
}

export type Historique = BilanSaison[]

// ----------------------------------------------------------------------------
//  8. L'état complet d'une partie, en mémoire (pas de sauvegarde persistante).
// ----------------------------------------------------------------------------

export interface GameState {
  seed: number // graine de l'aléatoire (rejouabilité / partage)
  saison: number // n° de saison en cours (1, 2, 3...)
  clubId: string // club actuellement entraîné
  jauges: Jauges
  effectif: Player[] // la liste vivante des joueurs
  historique: Historique // bilans des saisons déjà jouées
  palmares: Palmares // trophées gagnés sur toute la carrière
  reputation: number // 0-100, réputation du COACH (≠ prestige du club)
}
