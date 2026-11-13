import { describe, it, expect } from 'vitest'
import { appliquerResultatAuxJauges } from './jauges'
import type { Jauges } from './types'

const base: Jauges = { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 }

describe('appliquerResultatAuxJauges', () => {
  it('une victoire monte fans et direction', () => {
    const apres = appliquerResultatAuxJauges(base, 'victoire')
    expect(apres.fans).toBe(54)
    expect(apres.direction).toBe(53)
  })

  it('une défaite baisse fans et direction', () => {
    const apres = appliquerResultatAuxJauges(base, 'defaite')
    expect(apres.fans).toBe(46)
    expect(apres.direction).toBe(47)
  })

  it('un nul froisse un peu les fans seulement', () => {
    const apres = appliquerResultatAuxJauges(base, 'nul')
    expect(apres.fans).toBe(49)
    expect(apres.direction).toBe(50)
  })

  it('vestiaire et trésorerie ne bougent pas avec les résultats', () => {
    const apres = appliquerResultatAuxJauges(base, 'victoire')
    expect(apres.vestiaire).toBe(50)
    expect(apres.tresorerie).toBe(50)
  })

  it('reste borné : des fans déjà bas ne passent pas sous 0', () => {
    const presqueFini: Jauges = { ...base, fans: 2 }
    const apres = appliquerResultatAuxJauges(presqueFini, 'defaite')
    expect(apres.fans).toBe(0) // 2 - 4 = -2 → borné à 0
  })
})
