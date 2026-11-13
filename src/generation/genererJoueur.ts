import type { Player, Poste, Forme, Statut } from '../game/types'
import type { Rng } from '../game/rng'
import { PRENOMS, NOMS } from './noms'

// Ce dont on a besoin pour fabriquer UN joueur. Le poste et le niveau moyen sont
// imposés par le générateur d'effectif (au-dessus) : le poste vient de la
// composition voulue, le niveau moyen est dérivé du prestige du club.
interface OptionsJoueur {
  id: string
  poste: Poste
  niveauMoyen: number
}

// Pioche un élément au hasard dans une liste de chaînes (prénoms ou noms).
// index = un entier entre 0 et (longueur - 1), obtenu comme pour tirerScore.
function piocherDansListe(liste: string[], rng: Rng): string {
  const index = Math.floor(rng() * liste.length)
  return liste[index]
}

// Ramène une valeur dans l'intervalle [min, max] (garde-fou de bornes).
function borner(valeur: number, min: number, max: number): number {
  if (valeur < min) {
    return min
  }
  if (valeur > max) {
    return max
  }
  return valeur
}

export function genererJoueur(options: OptionsJoueur, rng: Rng): Player {
  // --- Identité : un prénom + un nom tirés dans nos réservoirs fictifs ---
  const prenom = piocherDansListe(PRENOMS, rng)
  const nom = piocherDansListe(NOMS, rng)

  // --- Âge ---
  // On veut une majorité de joueurs dans la force de l'âge (~22-30) et peu
  // d'extrêmes. Astuce : la MOYENNE de deux tirages aléatoires donne une courbe
  // "en cloche" centrée, au lieu d'un tirage uniforme plat qui donnerait autant
  // de joueurs de 17 ans que de 26 ans.
  const tirageAge = (rng() + rng()) / 2 // valeur centrée autour de 0.5
  const age = 17 + Math.floor(tirageAge * 18) // → entier entre 17 et 34, pic vers 26

  // --- Niveau ---
  // Centré sur le niveau moyen du club, avec un écart "en cloche" de ±12.
  // C'est cet écart qui crée le CHEVAUCHEMENT voulu : un petit club peut sortir
  // 1-2 joueurs nettement au-dessus de sa moyenne.
  const tirageEcart = (rng() + rng()) / 2 - 0.5 // centré sur 0, dans [-0.5, 0.5)
  const ecartNiveau = tirageEcart * 24 // → dans [-12, 12)
  const niveau = borner(Math.round(options.niveauMoyen + ecartNiveau), 30, 95)

  // --- Potentiel ---
  // C'est le plafond que le joueur peut atteindre en progressant. Les jeunes
  // (< 23 ans) ont une marge de progression ; les plus âgés plafonnent à leur
  // niveau actuel.
  let potentiel = niveau
  if (age < 23) {
    potentiel = niveau + (23 - age) * 2 // plus il est jeune, plus la marge est grande
  }
  potentiel = borner(potentiel, niveau, 99) // jamais sous le niveau, et max 99

  // Rare "pépite" : un très jeune (≤ 20 ans) a parfois un potentiel exceptionnel,
  // bien au-dessus de son niveau actuel (85-95). C'est le crack qu'un petit club
  // peut sortir et qui progresse vite si on le titularise. ~12 % des ≤ 20 ans.
  if (age <= 20 && rng() < 0.12) {
    const potentielCrack = 85 + Math.floor(rng() * 11) // entre 85 et 95
    // On ne baisse jamais un potentiel déjà élevé : on ne garde que si c'est mieux.
    if (potentielCrack > potentiel) {
      potentiel = potentielCrack
    }
  }

  // --- Mental : stat visible qui aide le joueur à juger le risque (30 à 90) ---
  const mental = 30 + Math.floor(rng() * 61)

  // --- Forme : +1 (en forme) ou -1 (méforme), environ 50/50 ---
  let forme: Forme = 1
  if (rng() < 0.5) {
    forme = -1
  }

  // --- Fraîcheur : élevée en début de partie (85 à 100) ---
  const fraicheur = 85 + Math.floor(rng() * 16)

  // --- Moral : correct au départ (50 à 70) ---
  const moral = 50 + Math.floor(rng() * 21)

  // --- Statut : la grande majorité est apte, ~10 % sont "incertain" ---
  let statut: Statut = 'apte'
  if (rng() < 0.1) {
    statut = 'incertain'
  }

  // --- Fin de contrat : 1 à 4 saisons après le début (on génère en saison 1) ---
  // floor(rng()*4) donne 0..3 ; +1 → 1..4 saisons de contrat ; +1 (saison de
  // départ) → le contrat se termine entre la saison 2 et la saison 5.
  const finContrat = 1 + 1 + Math.floor(rng() * 4)

  // On assemble et renvoie le joueur complet.
  return {
    id: options.id,
    prenom,
    nom,
    age,
    poste: options.poste,
    niveau,
    potentiel,
    mental,
    forme,
    fraicheur,
    moral,
    statut,
    finContrat,
  }
}
