import { describe, it, expect } from 'vitest'
import { faireVieillirJoueur, faireVieillirEffectif } from './progression'
import type { Player } from './types'

// Fabrique un joueur en ne fixant que ce qui compte pour la progression.
function joueur(age: number, niveau: number, potentiel: number): Player {
  return {
    id: 'x',
    prenom: '',
    nom: '',
    age,
    poste: 'M',
    niveau,
    potentiel,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
  }
}

describe('faireVieillirJoueur', () => {
  it('prend toujours un an de plus', () => {
    expect(faireVieillirJoueur(joueur(20, 60, 90)).age).toBe(21)
  })

  it('un jeune sous son potentiel progresse (sans le dépasser)', () => {
    // 18 ans, 70 → écart 20, +25% = +5 → 75
    const apres = faireVieillirJoueur(joueur(18, 70, 90))
    expect(apres.niveau).toBe(75)
    expect(apres.niveau).toBeLessThanOrEqual(apres.potentiel)
  })

  it('un jeune déjà à son potentiel ne progresse plus', () => {
    expect(faireVieillirJoueur(joueur(19, 90, 90)).niveau).toBe(90)
  })

  it('un joueur de la force de l’âge (29) reste stable', () => {
    expect(faireVieillirJoueur(joueur(29, 70, 90)).niveau).toBe(70)
  })

  it('un vétéran décline, de plus en plus avec l’âge', () => {
    // 32 → 33 ans : perte = 33 - 30 = 3 → 80 devient 77
    expect(faireVieillirJoueur(joueur(32, 80, 85)).niveau).toBe(77)
  })

  it('le niveau ne descend jamais sous 30', () => {
    const apres = faireVieillirJoueur(joueur(40, 31, 85))
    expect(apres.niveau).toBeGreaterThanOrEqual(30)
  })

  it('ne modifie pas le joueur d’origine (fonction pure)', () => {
    const jeune = joueur(18, 70, 90)
    faireVieillirJoueur(jeune)
    expect(jeune.age).toBe(18)
    expect(jeune.niveau).toBe(70)
  })
})

describe('faireVieillirEffectif', () => {
  it('fait vieillir tous les joueurs', () => {
    const effectif = [joueur(18, 70, 90), joueur(32, 80, 85)]
    const apres = faireVieillirEffectif(effectif)
    expect(apres[0].age).toBe(19)
    expect(apres[1].age).toBe(33)
  })
})
