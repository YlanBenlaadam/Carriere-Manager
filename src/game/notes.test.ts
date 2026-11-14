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

// Rappels de calcul (écart "en cloche" = (tirage - 0.5) * 5, tirage = (rng+rng)/2) :
//   rngFixe(0.5) → écart 0      → note = base
//   rngFixe(0)   → écart -2.5   → note = base - 2.5
// Bases : victoire 6.3, nul 5.5, défaite 4.7.

const valeurs = [0, 0.3, 0.6, 0.9, 0.99]

describe('genererNotes', () => {
  it('0-0 (nul) + rng=0.5 → tout le monde à la base 5.5', () => {
    const { notes } = genererNotes(squad(), { butsPour: 0, butsContre: 0 }, rngFixe(0.5))
    for (const id in notes) expect(notes[id]).toBe(5.5)
  })

  it('une note par joueur, pas plus', () => {
    const joueurs = squad()
    const { notes } = genererNotes(joueurs, { butsPour: 2, butsContre: 1 }, rngFixe(0.5))
    expect(Object.keys(notes).length).toBe(joueurs.length)
  })

  it('sur un nul, même au pire tirage, personne ne descend sous 3', () => {
    // base nul 5.5, écart -2.5 → 3.0. Les non-décisifs sont à 3, pas en dessous.
    const { notes } = genererNotes(squad(), { butsPour: 1, butsContre: 1 }, rngFixe(0))
    expect(notes['p0']).toBe(3) // le gardien n'est jamais buteur → reste à 3
    expect(notes['p0']).toBeGreaterThanOrEqual(3)
  })

  it('un buteur a une note élevée (≥ 8), même avec un mauvais tirage', () => {
    // rng=0 → note brute 3.8, mais le plancher buteur la remonte à 8.
    const { notes } = genererNotes(squad(), { butsPour: 1, butsContre: 0 }, rngFixe(0))
    expect(notes['p1']).toBeGreaterThanOrEqual(8)
  })

  it('le buteur est nettement au-dessus des non-décisifs', () => {
    // victoire rng=0 : non-décisifs à 6.3 - 2.5 = 3.8 ; p1 (buteur) remonté à 8.
    const { notes } = genererNotes(squad(), { butsPour: 1, butsContre: 0 }, rngFixe(0))
    expect(notes['p1']).toBe(8)
    expect(notes['p2']).toBe(3.8)
    expect(notes['p0']).toBe(3.8) // gardien, non décisif
  })

  it('enregistre les buteurs et passeurs', () => {
    const { buteurs, passeurs } = genererNotes(squad(), { butsPour: 1, butsContre: 0 }, rngFixe(0))
    expect(buteurs['p1']).toBe(1)
    expect(passeurs['p1']).toBe(1)
    expect(buteurs['p2']).toBeUndefined()
  })

  it('aucun but marqué → aucun buteur enregistré', () => {
    const { buteurs } = genererNotes(squad(), { butsPour: 0, butsContre: 2 }, rngFixe(0.5))
    expect(Object.keys(buteurs).length).toBe(0)
  })

  it('invariant : toutes les notes restent dans [1, 10]', () => {
    for (const v of valeurs) {
      const { notes } = genererNotes(squad(), { butsPour: 3, butsContre: 1 }, rngFixe(v))
      for (const id in notes) {
        expect(notes[id]).toBeGreaterThanOrEqual(1)
        expect(notes[id]).toBeLessThanOrEqual(10)
      }
    }
  })
})
