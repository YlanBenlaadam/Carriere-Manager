import { describe, it, expect } from 'vitest'
import { ajouterTrophee, compterTrophees } from './palmares'
import type { Palmares } from './types'

describe('ajouterTrophee', () => {
  it('ajoute un trophée et renvoie un nouveau palmarès', () => {
    const vide: Palmares = []
    const apres = ajouterTrophee(vide, { saison: 1, competition: 'championnat' })
    expect(apres.length).toBe(1)
    expect(apres[0].competition).toBe('championnat')
  })

  it('ne modifie pas le palmarès d’origine (fonction pure)', () => {
    const palmares: Palmares = []
    ajouterTrophee(palmares, { saison: 1, competition: 'ldc' })
    expect(palmares.length).toBe(0) // l'original reste vide
  })
})

describe('compterTrophees', () => {
  it('compte les trophées d’un type donné', () => {
    const palmares: Palmares = [
      { saison: 1, competition: 'championnat' },
      { saison: 2, competition: 'championnat' },
      { saison: 2, competition: 'coupe_nationale' },
    ]
    expect(compterTrophees(palmares, 'championnat')).toBe(2)
    expect(compterTrophees(palmares, 'coupe_nationale')).toBe(1)
    expect(compterTrophees(palmares, 'ldc')).toBe(0)
  })
})
