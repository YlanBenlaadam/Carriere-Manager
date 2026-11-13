import { describe, it, expect } from 'vitest'
import { CLUBS } from './clubs'

// Les 5 championnats autorisés (version "runtime" : un type TS n'existe pas à
// l'exécution, donc on redéclare la liste ici pour pouvoir la vérifier).
const CHAMPIONNATS_VALIDES = ['France', 'Angleterre', 'Espagne', 'Italie', 'Allemagne']

// Une couleur doit être un code hexa de 6 chiffres précédé de # (ex. #0B1F4D).
const HEX = /^#[0-9A-Fa-f]{6}$/

describe('données des clubs', () => {
  it('les ids sont tous uniques', () => {
    const ids = CLUBS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque club a des champs valides', () => {
    for (const club of CLUBS) {
      expect(club.nom.length).toBeGreaterThan(0)
      expect(CHAMPIONNATS_VALIDES).toContain(club.championnat)
      expect(club.prestige).toBeGreaterThanOrEqual(0)
      expect(club.prestige).toBeLessThanOrEqual(100)
      expect(club.budget).toBeGreaterThan(0)
      expect(club.couleurs.principale).toMatch(HEX)
      expect(club.couleurs.secondaire).toMatch(HEX)
    }
  })

  it('chaque championnat présent compte exactement 10 clubs (homogénéité)', () => {
    // On regroupe les clubs par championnat et on vérifie que chaque ligue en a 10.
    const parChampionnat: Record<string, number> = {}
    for (const club of CLUBS) {
      if (parChampionnat[club.championnat] === undefined) {
        parChampionnat[club.championnat] = 0
      }
      parChampionnat[club.championnat]++
    }
    for (const championnat in parChampionnat) {
      expect(parChampionnat[championnat]).toBe(10)
    }
  })
})
