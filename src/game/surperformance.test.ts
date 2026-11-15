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
  // Championnat à 10 clubs. rngFixe(0.5) → le petit hasard vaut 0 (centré).
  it('finir bas MAIS au rang attendu → note moyenne (pas excellente)', () => {
    // 9e sur 10, attendu 9e → place basse + pas de dépassement → ~5.7 (jaune).
    const note = noteSurperformance(9, 9, 10, rngFixe(0.5))
    expect(note).toBeGreaterThan(4)
    expect(note).toBeLessThan(7) // surtout : ce n'est PAS 9+
  })

  it('grimper très au-dessus de l’attendu → excellente note', () => {
    // 2e sur 10 alors qu'attendu 9e → bonne place + gros dépassement → vert élevé.
    const note = noteSurperformance(2, 9, 10, rngFixe(0.5))
    expect(note).toBeGreaterThanOrEqual(9)
  })

  it('finir dernier bien en dessous de l’attendu → mauvaise note', () => {
    // 10e sur 10, attendu 5e → place basse + sous-performance → rouge (< 5).
    const note = noteSurperformance(10, 5, 10, rngFixe(0.5))
    expect(note).toBeLessThan(5)
  })

  it('reste bornée dans [1, 10]', () => {
    expect(noteSurperformance(1, 10, 10, rngFixe(0.99))).toBeLessThanOrEqual(10)
    expect(noteSurperformance(10, 1, 10, rngFixe(0))).toBeGreaterThanOrEqual(1)
  })
})
