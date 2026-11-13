// Générateur aléatoire reproductible (algorithme "mulberry32", standard et éprouvé).
// Idée : à partir d'une graine (seed), on obtient toujours la MÊME suite de nombres.
// Indispensable pour rejouer/partager une partie et pour tester le moteur.

/** Un Rng est simplement une fonction : chaque appel donne le nombre suivant,
 *  un flottant dans [0, 1) (0 inclus, 1 exclu), comme Math.random(). */
export type Rng = () => number

/** Crée un générateur à partir d'une graine entière.
 *  Retourne une FONCTION qui "retient" sa position : appel après appel, elle
 *  avance dans la suite. Deux générateurs créés avec la même graine donnent
 *  exactement la même séquence. */
export function creerRng(seed: number): Rng {
  // "etat" est la mémoire interne du générateur. Le >>> 0 force un entier
  // 32 bits non signé (le format sur lequel l'algorithme travaille).
  let etat = seed >>> 0

  // La fonction renvoyée garde l'accès à "etat" (c'est une "closure") : elle
  // modifie et se souvient de etat entre deux appels, sans variable globale.
  return function () {
    etat = (etat + 0x6d2b79f5) | 0
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
