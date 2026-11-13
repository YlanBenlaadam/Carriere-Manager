import { describe, it, expect } from 'vitest'
import { genererEffectif } from './genererEffectif'
import { creerRng } from '../game/rng'
import type { Poste } from '../game/types'

// Compte combien de joueurs occupent un poste donné dans l'effectif.
function compter(effectif: { poste: Poste }[], poste: Poste): number {
  return effectif.filter((j) => j.poste === poste).length
}

describe('genererEffectif', () => {
  it('produit 20 joueurs répartis 2 G / 6 D / 7 M / 5 A', () => {
    const effectif = genererEffectif('lyon', 60, creerRng(1))
    expect(effectif.length).toBe(20)
    expect(compter(effectif, 'G')).toBe(2)
    expect(compter(effectif, 'D')).toBe(6)
    expect(compter(effectif, 'M')).toBe(7)
    expect(compter(effectif, 'A')).toBe(5)
  })

  it('donne des ids uniques, préfixés par le club', () => {
    const effectif = genererEffectif('lyon', 60, creerRng(1))
    const ids = effectif.map((j) => j.id)
    const idsUniques = new Set(ids)
    expect(idsUniques.size).toBe(effectif.length) // aucun doublon
    expect(ids[0]).toBe('lyon-1')
  })

  it('reproductibilité : même seed → même effectif', () => {
    const a = genererEffectif('lyon', 60, creerRng(42))
    const b = genererEffectif('lyon', 60, creerRng(42))
    expect(a).toEqual(b)
  })

  it('un club prestigieux a un effectif en moyenne meilleur qu’un petit club', () => {
    const gros = genererEffectif('gros', 90, creerRng(1))
    const petit = genererEffectif('petit', 20, creerRng(1))
    const moyenne = (e: { niveau: number }[]) =>
      e.reduce((somme, j) => somme + j.niveau, 0) / e.length
    expect(moyenne(gros)).toBeGreaterThan(moyenne(petit))
  })
})
