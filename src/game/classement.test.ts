import { describe, it, expect } from 'vitest'
import { calculerClassement } from './classement'
import type { ResultatRencontre } from './types'

describe('calculerClassement', () => {
  it('attribue 3 points au vainqueur, 0 au perdant', () => {
    const resultats: ResultatRencontre[] = [
      { domicile: 'a', exterieur: 'b', butsDomicile: 2, butsExterieur: 0 },
    ]
    const classement = calculerClassement(resultats)
    const a = classement.find((l) => l.clubId === 'a')!
    const b = classement.find((l) => l.clubId === 'b')!
    expect(a.points).toBe(3)
    expect(a.gagnes).toBe(1)
    expect(b.points).toBe(0)
    expect(b.perdus).toBe(1)
  })

  it('attribue 1 point à chacun en cas de nul', () => {
    const resultats: ResultatRencontre[] = [
      { domicile: 'a', exterieur: 'b', butsDomicile: 1, butsExterieur: 1 },
    ]
    const classement = calculerClassement(resultats)
    expect(classement.find((l) => l.clubId === 'a')!.points).toBe(1)
    expect(classement.find((l) => l.clubId === 'b')!.points).toBe(1)
  })

  it('cumule buts pour/contre et calcule la différence', () => {
    const resultats: ResultatRencontre[] = [
      { domicile: 'a', exterieur: 'b', butsDomicile: 3, butsExterieur: 1 },
      { domicile: 'a', exterieur: 'c', butsDomicile: 0, butsExterieur: 2 },
    ]
    const a = calculerClassement(resultats).find((l) => l.clubId === 'a')!
    expect(a.joues).toBe(2)
    expect(a.butsPour).toBe(3) // 3 + 0
    expect(a.butsContre).toBe(3) // 1 + 2
    expect(a.difference).toBe(0)
  })

  it('trie par points, puis différence de buts, puis buts marqués', () => {
    // a et b finissent à 3 pts ; a a une meilleure différence → a devant b.
    const resultats: ResultatRencontre[] = [
      { domicile: 'a', exterieur: 'x', butsDomicile: 5, butsExterieur: 0 }, // a: +5
      { domicile: 'b', exterieur: 'y', butsDomicile: 1, butsExterieur: 0 }, // b: +1
    ]
    const classement = calculerClassement(resultats)
    expect(classement[0].clubId).toBe('a') // meilleure diff → 1er
    expect(classement[1].clubId).toBe('b')
  })

  it('le total des points distribués est cohérent (3 par match décisif)', () => {
    const resultats: ResultatRencontre[] = [
      { domicile: 'a', exterieur: 'b', butsDomicile: 2, butsExterieur: 1 },
      { domicile: 'c', exterieur: 'd', butsDomicile: 0, butsExterieur: 0 },
    ]
    const classement = calculerClassement(resultats)
    const totalPoints = classement.reduce((somme, l) => somme + l.points, 0)
    // 1 match décisif (3 pts) + 1 nul (1 + 1 = 2 pts) = 5
    expect(totalPoints).toBe(5)
  })
})
