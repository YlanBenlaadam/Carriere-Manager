import { describe, it, expect } from 'vitest'
import { competitionEuropeenne, choisirAdversaireFinale } from './coupe'
import type { Club, Couleurs } from './types'
import type { Rng } from './rng'

function rngFixe(valeur: number): Rng {
  return () => valeur
}

const couleurs: Couleurs = { principale: '#000000', secondaire: '#FFFFFF' }

function club(id: string, championnat: Club['championnat'], prestige: number): Club {
  return { id, nom: id, championnat, prestige, budget: 10, couleurs }
}

// Un petit jeu de clubs couvrant les paliers et deux championnats.
const clubs: Club[] = [
  club('psg', 'France', 100),
  club('om', 'France', 78),
  club('lyon', 'France', 62),
  club('reims', 'France', 36),
  club('city', 'Angleterre', 100),
  club('chelsea', 'Angleterre', 78),
]

describe('competitionEuropeenne', () => {
  it('100 → LDC ; 78 et 62 → Europa ; 48 et 36 → aucune', () => {
    expect(competitionEuropeenne(100)).toBe('ldc')
    expect(competitionEuropeenne(78)).toBe('europa')
    expect(competitionEuropeenne(62)).toBe('europa')
    expect(competitionEuropeenne(48)).toBe(null)
    expect(competitionEuropeenne(36)).toBe(null)
  })
})

describe('choisirAdversaireFinale', () => {
  it('coupe nationale, petit club → tombe sur un cador de son championnat', () => {
    const reims = clubs.find((c) => c.id === 'reims')!
    const adv = choisirAdversaireFinale('coupe_nationale', reims, clubs, rngFixe(0))
    expect(adv.id).toBe('psg') // seul cador français → c'est lui
  })

  it('coupe nationale, cador → n’importe quel club de son championnat', () => {
    const psg = clubs.find((c) => c.id === 'psg')!
    const adv = choisirAdversaireFinale('coupe_nationale', psg, clubs, rngFixe(0))
    expect(adv.championnat).toBe('France')
    expect(adv.id).not.toBe('psg')
  })

  it('LDC → adversaire cador (prestige ≥ 90), tous pays confondus', () => {
    const psg = clubs.find((c) => c.id === 'psg')!
    const adv = choisirAdversaireFinale('ldc', psg, clubs, rngFixe(0))
    expect(adv.prestige).toBeGreaterThanOrEqual(90)
    expect(adv.id).not.toBe('psg')
  })

  it('Europa → adversaire mid (prestige 60 à 89)', () => {
    const om = clubs.find((c) => c.id === 'om')!
    const adv = choisirAdversaireFinale('europa', om, clubs, rngFixe(0))
    expect(adv.prestige).toBeGreaterThanOrEqual(60)
    expect(adv.prestige).toBeLessThan(90)
    expect(adv.id).not.toBe('om')
  })
})
