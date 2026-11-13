import { describe, it, expect } from 'vitest'
import { classementAttendu, rangDe, noteSurperformance } from './surperformance'

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
  it('rang réel = rang attendu → note de base (5.5)', () => {
    expect(noteSurperformance(5, 5)).toBe(5.5)
  })

  it('finir plus haut que prévu → note au-dessus de la base', () => {
    // attendu 8e, fini 3e → écart +5 → 5.5 + 5*0.5 = 8
    expect(noteSurperformance(3, 8)).toBe(8)
  })

  it('finir plus bas que prévu → note en dessous de la base', () => {
    // attendu 3e, fini 8e → écart -5 → 5.5 - 2.5 = 3
    expect(noteSurperformance(8, 3)).toBe(3)
  })

  it('reste bornée dans [0, 10]', () => {
    expect(noteSurperformance(1, 20)).toBe(10) // surperformance énorme → plafond 10
    expect(noteSurperformance(20, 1)).toBe(0) // effondrement → plancher 0
  })
})
