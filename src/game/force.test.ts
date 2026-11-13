import { describe, it, expect } from 'vitest'
import { calculerForces } from './force'
import type { Player, Poste } from './types'

// Petit atelier à joueurs : fabrique un Player avec des valeurs bidon,
// sauf le poste et le niveau qui sont les seuls à compter pour la force.
function joueur(poste: Poste, niveau: number): Player {
  return {
    id: 'x',
    prenom: '',
    nom: '',
    age: 25,
    poste,
    niveau,
    potentiel: niveau,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
  }
}

// Un XI classique (1 G, 4 D, 4 M, 2 A) dont tous les joueurs ont le même niveau.
function xiUniforme(niveau: number): Player[] {
  return [
    joueur('G', niveau),
    joueur('D', niveau),
    joueur('D', niveau),
    joueur('D', niveau),
    joueur('D', niveau),
    joueur('M', niveau),
    joueur('M', niveau),
    joueur('M', niveau),
    joueur('M', niveau),
    joueur('A', niveau),
    joueur('A', niveau),
  ]
}

describe('calculerForces', () => {
  it('liste vide → forces nulles (garde-fou division par 0)', () => {
    expect(calculerForces([])).toEqual({ attaque: 0, defense: 0 })
  })

  it('XI tout niveau 50 → attaque et defense ≈ 50', () => {
    const forces = calculerForces(xiUniforme(50))
    expect(forces.attaque).toBeCloseTo(50)
    expect(forces.defense).toBeCloseTo(50)
  })

  it('2 attaquants boostés à 90 → attaque monte plus que la defense', () => {
    const equipe = xiUniforme(50)
    equipe[9].niveau = 90 // les 2 attaquants
    equipe[10].niveau = 90
    const forces = calculerForces(equipe)
    expect(forces.attaque).toBeGreaterThan(50)
    expect(forces.attaque).toBeGreaterThan(forces.defense)
  })

  it('4 défenseurs boostés à 90 → defense monte plus que l’attaque', () => {
    const equipe = xiUniforme(50)
    equipe[1].niveau = 90 // les 4 défenseurs
    equipe[2].niveau = 90
    equipe[3].niveau = 90
    equipe[4].niveau = 90
    const forces = calculerForces(equipe)
    expect(forces.defense).toBeGreaterThan(50)
    expect(forces.defense).toBeGreaterThan(forces.attaque)
  })
})
