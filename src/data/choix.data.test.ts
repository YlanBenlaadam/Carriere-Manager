import { describe, it, expect } from 'vitest'
import { CHOIX } from './choix'

// Les familles de choix autorisées (version "runtime" pour pouvoir vérifier).
const FAMILLES = ['composition', 'tactique', 'gestion_humaine', 'contexte']

describe('contenu des choix', () => {
  it('les ids sont tous uniques', () => {
    const ids = CHOIX.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque choix est bien formé', () => {
    for (const choix of CHOIX) {
      expect(choix.texte.length).toBeGreaterThan(0)
      expect(FAMILLES).toContain(choix.famille)
      // Un choix doit proposer au moins 2 options (sinon ce n'est pas un choix).
      expect(choix.options.length).toBeGreaterThanOrEqual(2)
      for (const option of choix.options) {
        expect(option.texte.length).toBeGreaterThan(0)
      }
    }
  })
})
