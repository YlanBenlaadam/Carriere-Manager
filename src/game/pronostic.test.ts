import { describe, it, expect } from 'vitest'
import { calculerPronostic } from './pronostic'
import type { Forces } from './types'

// Raccourci pour fabriquer des forces { attaque, defense }.
function f(attaque: number, defense: number): Forces {
  return { attaque, defense }
}

describe('calculerPronostic', () => {
  it('équipes identiques → pronostic équilibré 33/34/33', () => {
    expect(calculerPronostic(f(50, 50), f(50, 50))).toEqual({
      victoire: 0.33,
      nul: 0.34,
      defaite: 0.33,
    })
  })

  it('léger avantage (avantage = 10) → 45/30/25', () => {
    expect(calculerPronostic(f(55, 55), f(50, 50))).toEqual({
      victoire: 0.45,
      nul: 0.3,
      defaite: 0.25,
    })
  })

  it('gros favori (avantage = 60) → 80/15/5', () => {
    expect(calculerPronostic(f(70, 70), f(40, 40))).toEqual({
      victoire: 0.8,
      nul: 0.15,
      defaite: 0.05,
    })
  })

  it('invariant : victoire + nul + defaite === 1, quelles que soient les forces', () => {
    const paires: Array<[Forces, Forces]> = [
      [f(50, 50), f(50, 50)],
      [f(80, 80), f(30, 30)],
      [f(30, 30), f(80, 80)],
      [f(60, 45), f(50, 55)],
      [f(100, 0), f(0, 100)],
    ]
    for (const [nous, adv] of paires) {
      const p = calculerPronostic(nous, adv)
      expect(p.victoire + p.nul + p.defaite).toBeCloseTo(1)
    }
  })
})
