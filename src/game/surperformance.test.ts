import { describe, it, expect } from 'vitest'
import { classementAttendu, rangDe, noteSurperformance } from './surperformance'
import type { Rng } from './rng'

// Faux rng : renvoie toujours la valeur fixée → note déterministe dans son palier.
function rngFixe(valeur: number): Rng {
  return () => valeur
}

describe('classementAttendu', () => {
  it('trie les clubs par force décroissante', () => {
    const forces = { petit: 50, geant: 85, moyen: 65 }
    expect(classementAttendu(forces)).toEqual(['geant', 'moyen', 'petit'])
  })
})

describe('rangDe', () => {
  it('renvoie la position à partir de 1', () => {
    const classement = ['geant', 'moyen', 'petit']
    expect(rangDe(classement, 'geant')).toBe(1)
    expect(rangDe(classement, 'petit')).toBe(3)
  })

  it('renvoie -1 si le club est absent', () => {
    expect(rangDe(['a', 'b'], 'z')).toBe(-1)
  })
})

describe('noteSurperformance', () => {
  it('fini au rang attendu → palier excellent (7 à 10)', () => {
    // rangReel = rangAttendu → ecart 0 → palier "7 à 10". rngFixe(0) donne le bas = 7.
    expect(noteSurperformance(5, 5, rngFixe(0))).toBe(7)
    expect(noteSurperformance(5, 5, rngFixe(0.5))).toBe(8.5)
  })

  it('fini mieux que prévu → palier excellent aussi', () => {
    // attendu 8e, fini 3e → ecart +5 >= 0 → 7 à 10.
    const note = noteSurperformance(3, 8, rngFixe(0.5))
    expect(note).toBeGreaterThanOrEqual(7)
    expect(note).toBeLessThanOrEqual(10)
  })

  it('1 à 3 places sous l’attendu → palier moyen (5 à 6)', () => {
    // attendu 5e, fini 7e → ecart -2 → 5 à 6. rngFixe(0) donne 5.
    expect(noteSurperformance(7, 5, rngFixe(0))).toBe(5)
    expect(noteSurperformance(7, 5, rngFixe(0.5))).toBe(5.5)
  })

  it('plus de 3 places sous l’attendu → palier raté (2 à 4.5)', () => {
    // attendu 5e, fini 10e → ecart -5 → 2 à 4.5. rngFixe(0) donne 2.
    expect(noteSurperformance(10, 5, rngFixe(0))).toBe(2)
    const note = noteSurperformance(10, 5, rngFixe(0.99))
    expect(note).toBeLessThan(5)
  })
})
