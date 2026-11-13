import { describe, it, expect } from 'vitest'
import { genererNotes } from './notes'
import type { Player, Poste } from './types'
import type { Rng } from './rng'

function rngFixe(valeur: number): Rng {
  return () => valeur
}

function joueur(id: string, poste: Poste): Player {
  return {
    id,
    prenom: '',
    nom: '',
    age: 25,
    poste,
    niveau: 50,
    potentiel: 50,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
  }
}

// 1 gardien (p0) + 10 joueurs de champ (p1..p10).
function squad(): Player[] {
  const joueurs: Player[] = [joueur('p0', 'G')]
  for (let i = 1; i <= 10; i++) joueurs.push(joueur('p' + i, 'M'))
  return joueurs
}

const valeurs = [0, 0.3, 0.6, 0.9, 0.99]

describe('genererNotes', () => {
  it('0-0 (nul, aucun but) + rng=0.5 → tout le monde à la base 5.5', () => {
    const notes = genererNotes(squad(), { butsPour: 0, butsContre: 0 }, rngFixe(0.5))
    for (const id in notes) expect(notes[id]).toBe(5.5)
  })

  it('une note par joueur, pas plus', () => {
    const joueurs = squad()
    const notes = genererNotes(joueurs, { butsPour: 2, butsContre: 1 }, rngFixe(0.5))
    expect(Object.keys(notes).length).toBe(joueurs.length)
  })

  it('clamp bas : défaite 0-3 + rng=0 → toutes les notes à 1', () => {
    // base 4.5 + écart -4 = 0.5, sous le plancher → 1
    const notes = genererNotes(squad(), { butsPour: 0, butsContre: 3 }, rngFixe(0))
    for (const id in notes) expect(notes[id]).toBe(1)
  })

  it('clamp haut : le gardien (jamais boosté) plafonne à 10', () => {
    // victoire, rng≈1 → base 6.5 + écart ≈ +4 = ~10.5 → 10
    const notes = genererNotes(squad(), { butsPour: 1, butsContre: 0 }, rngFixe(0.9999))
    expect(notes['p0']).toBe(10)
  })

  it('le buteur reçoit un bonus par rapport aux non-décisifs', () => {
    // rng=0 : écart -4 pour tous (raw 2.5 en victoire), et index tirés = 0 → p1.
    // p1 = buteur (+1.5) ET passeur (+0.8) = 2.5 + 2.3 = 4.8 ; les autres restent à 2.5.
    const notes = genererNotes(squad(), { butsPour: 1, butsContre: 0 }, rngFixe(0))
    expect(notes['p1']).toBe(4.8)
    expect(notes['p2']).toBe(2.5)
    expect(notes['p0']).toBe(2.5) // le gardien n'est jamais buteur
  })

  it('invariant : toutes les notes restent dans [1, 10]', () => {
    for (const v of valeurs) {
      const notes = genererNotes(squad(), { butsPour: 3, butsContre: 1 }, rngFixe(v))
      for (const id in notes) {
        expect(notes[id]).toBeGreaterThanOrEqual(1)
        expect(notes[id]).toBeLessThanOrEqual(10)
      }
    }
  })
})
