import { describe, it, expect } from 'vitest'
import { genererCalendrier } from './calendrier'

// Fabrique une liste d'ids de clubs factices : ['c0', 'c1', ... 'c(n-1)'].
function clubs(n: number): string[] {
  const liste: string[] = []
  for (let i = 0; i < n; i++) {
    liste.push('c' + i)
  }
  return liste
}

describe('genererCalendrier', () => {
  it('10 clubs → 45 rencontres (N*(N-1)/2)', () => {
    expect(genererCalendrier(clubs(10)).length).toBe(45)
  })

  it('2 clubs → 1 seule rencontre', () => {
    expect(genererCalendrier(clubs(2)).length).toBe(1)
  })

  it('aucune rencontre d’un club contre lui-même', () => {
    for (const r of genererCalendrier(clubs(10))) {
      expect(r.domicile).not.toBe(r.exterieur)
    }
  })

  it('chaque club apparaît dans exactement 9 rencontres (sur 10 clubs)', () => {
    const rencontres = genererCalendrier(clubs(10))
    // On compte, pour chaque club, le nombre de rencontres où il figure
    // (que ce soit à domicile ou à l'extérieur).
    const apparitions: Record<string, number> = {}
    for (const r of rencontres) {
      apparitions[r.domicile] = (apparitions[r.domicile] ?? 0) + 1
      apparitions[r.exterieur] = (apparitions[r.exterieur] ?? 0) + 1
    }
    for (const club in apparitions) {
      expect(apparitions[club]).toBe(9)
    }
  })

  it('aucune paire en double (chaque duo exactement une fois)', () => {
    const rencontres = genererCalendrier(clubs(10))
    // On fabrique une "clé" indépendante de l'ordre (duo trié) pour chaque
    // rencontre, et on vérifie qu'il n'y a aucun doublon.
    const cles = new Set<string>()
    for (const r of rencontres) {
      const duoTrie = [r.domicile, r.exterieur].sort().join('-')
      cles.add(duoTrie)
    }
    expect(cles.size).toBe(rencontres.length)
  })
})
