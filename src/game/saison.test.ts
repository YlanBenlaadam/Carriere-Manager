import { describe, it, expect } from 'vitest'
import { forceGlobale, simulerRencontre, simulerSaison, faireBilan } from './saison'
import { genererEffectif } from '../generation/genererEffectif'
import { creerRng } from './rng'
import type { LigneClassement, Player, Jauges } from './types'

// Construit des effectifs réalistes pour une liste de clubs (via le générateur).
function effectifsPour(clubIds: string[], prestige: number): Record<string, Player[]> {
  const dico: Record<string, Player[]> = {}
  for (const id of clubIds) {
    dico[id] = genererEffectif(id, prestige, creerRng(id.length + prestige))
  }
  return dico
}

describe('forceGlobale', () => {
  it('un gros club est plus fort qu’un petit', () => {
    const gros = genererEffectif('gros', 90, creerRng(1))
    const petit = genererEffectif('petit', 30, creerRng(1))
    expect(forceGlobale(gros)).toBeGreaterThan(forceGlobale(petit))
  })
})

describe('simulerRencontre', () => {
  it('renvoie un résultat cohérent (bons ids, buts entiers positifs)', () => {
    const effectifs = effectifsPour(['a', 'b'], 60)
    const res = simulerRencontre({ domicile: 'a', exterieur: 'b' }, effectifs, creerRng(5))
    expect(res.domicile).toBe('a')
    expect(res.exterieur).toBe('b')
    expect(Number.isInteger(res.butsDomicile)).toBe(true)
    expect(res.butsDomicile).toBeGreaterThanOrEqual(0)
    expect(res.butsExterieur).toBeGreaterThanOrEqual(0)
  })

  it('reproductible : même seed → même résultat', () => {
    const effectifs = effectifsPour(['a', 'b'], 60)
    const r1 = simulerRencontre({ domicile: 'a', exterieur: 'b' }, effectifs, creerRng(5))
    const r2 = simulerRencontre({ domicile: 'a', exterieur: 'b' }, effectifs, creerRng(5))
    expect(r1).toEqual(r2)
  })
})

describe('simulerSaison', () => {
  it('10 clubs → 45 rencontres, 10 lignes de classement, 9 matchs chacun', () => {
    const clubIds = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']
    const effectifs = effectifsPour(clubIds, 60)
    const { resultats, classement } = simulerSaison(clubIds, effectifs, creerRng(1))
    expect(resultats.length).toBe(45)
    expect(classement.length).toBe(10)
    for (const ligne of classement) {
      expect(ligne.joues).toBe(9)
    }
  })
})

describe('faireBilan', () => {
  // Petite ligne de classement minimale (seul le clubId compte pour le rang).
  function ligne(clubId: string): LigneClassement {
    return {
      clubId,
      points: 0,
      joues: 0,
      gagnes: 0,
      nuls: 0,
      perdus: 0,
      butsPour: 0,
      butsContre: 0,
      difference: 0,
    }
  }

  const jaugesOk: Jauges = { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 }
  const forces = { geant: 85, moyen: 65, petit: 50 } // attendu : geant, moyen, petit

  it('surperformance : petit club fini 1er alors qu’attendu 3e → bonne note', () => {
    // Classement réel : petit 1er, geant 2e, moyen 3e.
    const classementReel = [ligne('petit'), ligne('geant'), ligne('moyen')]
    const bilan = faireBilan('petit', classementReel, forces, jaugesOk)
    expect(bilan.rangReel).toBe(1)
    expect(bilan.rangAttendu).toBe(3) // petit = le plus faible → attendu dernier
    expect(bilan.note).toBeGreaterThan(5.5) // mieux que prévu
    expect(bilan.licencie).toBe(false)
  })

  it('licencié si une jauge est à 0', () => {
    const classementReel = [ligne('geant'), ligne('moyen'), ligne('petit')]
    const jaugesMortes: Jauges = { ...jaugesOk, fans: 0 }
    const bilan = faireBilan('geant', classementReel, forces, jaugesMortes)
    expect(bilan.licencie).toBe(true)
  })
})
