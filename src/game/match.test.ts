import { describe, it, expect } from 'vitest'
import { tirerIssue, jouerMatch, jouerMatchAvecOption } from './match'
import { creerRng } from './rng'
import type { Option, Player, Poste, Pronostic } from './types'
import type { Rng } from './rng'

// Un faux rng : une fonction qui renvoie toujours la valeur qu'on lui fixe.
// Comme rng est un paramètre, on contrôle le tirage → test 100 % déterministe.
function rngFixe(valeur: number): Rng {
  return () => valeur
}

const pronostic: Pronostic = { victoire: 0.45, nul: 0.3, defaite: 0.25 }

describe('tirerIssue', () => {
  it('r dans la tranche victoire [0, 0.45) → victoire', () => {
    expect(tirerIssue(pronostic, rngFixe(0))).toBe('victoire')
  })

  it('r dans la tranche nul [0.45, 0.75) → nul', () => {
    expect(tirerIssue(pronostic, rngFixe(0.5))).toBe('nul')
  })

  it('r dans la tranche defaite [0.75, 1) → defaite', () => {
    expect(tirerIssue(pronostic, rngFixe(0.9))).toBe('defaite')
  })

  it('frontière : r = 0.45 exactement → nul (car < strict)', () => {
    expect(tirerIssue(pronostic, rngFixe(0.45))).toBe('nul')
  })
})

function joueur(id: string, poste: Poste, niveau: number): Player {
  return {
    id,
    prenom: '',
    nom: '',
    age: 25,
    poste,
    niveau,
    potentiel: niveau,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
  }
}

// Un XI 1-4-4-2 d'un niveau donné, avec des id uniques.
function xi(prefixe: string, niveau: number): Player[] {
  const postes: Poste[] = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'M', 'A', 'A']
  return postes.map((poste, i) => joueur(prefixe + i, poste, niveau))
}

describe('jouerMatch', () => {
  it('le pronostic renvoyé est cohérent (somme ≈ 1)', () => {
    const r = jouerMatch(xi('a', 60), xi('b', 50), creerRng(1))
    expect(r.pronostic.victoire + r.pronostic.nul + r.pronostic.defaite).toBeCloseTo(1)
  })

  it('une note par joueur de notre équipe', () => {
    const nos = xi('a', 60)
    const r = jouerMatch(nos, xi('b', 50), creerRng(1))
    expect(Object.keys(r.notes).length).toBe(nos.length)
  })

  it('les buts sont des entiers positifs', () => {
    const r = jouerMatch(xi('a', 60), xi('b', 50), creerRng(1))
    expect(Number.isInteger(r.butsPour)).toBe(true)
    expect(Number.isInteger(r.butsContre)).toBe(true)
    expect(r.butsPour).toBeGreaterThanOrEqual(0)
    expect(r.butsContre).toBeGreaterThanOrEqual(0)
  })

  it('reproductibilité : même seed → match identique', () => {
    const match1 = jouerMatch(xi('a', 60), xi('b', 50), creerRng(42))
    const match2 = jouerMatch(xi('a', 60), xi('b', 50), creerRng(42))
    expect(match1).toEqual(match2)
  })
})

describe('jouerMatchAvecOption', () => {
  it('option undefined → résultat identique à jouerMatch (même seed)', () => {
    // Sans option, la version "avec option" doit se comporter exactement comme
    // la version simple : c'est la garantie que la délégation ne change rien.
    const avec = jouerMatchAvecOption(xi('a', 55), xi('b', 55), undefined, creerRng(7))
    const simple = jouerMatch(xi('a', 55), xi('b', 55), creerRng(7))
    expect(avec).toEqual(simple)
  })

  it('effetsForces (attaque ×3) → augmente la probabilité de victoire', () => {
    // Deux équipes de même niveau : pronostic de base équilibré (~0.33 de victoire).
    // Une option qui triple notre attaque doit faire grimper cette probabilité.
    const optionOffensive: Option = { texte: 'Tout pour l’attaque', effetsForces: { attaque: 3 } }
    const sansOption = jouerMatchAvecOption(xi('a', 50), xi('b', 50), undefined, creerRng(1))
    const avecOption = jouerMatchAvecOption(xi('a', 50), xi('b', 50), optionOffensive, creerRng(1))
    expect(avecOption.pronostic.victoire).toBeGreaterThan(sansOption.pronostic.victoire)
  })

  it('effetsVariance = 1 → pronostic ramené à 33/33/33', () => {
    // Une variance maximale rend le match totalement imprévisible : les trois
    // issues deviennent équiprobables, quel que soit l'écart de niveau.
    const optionChaos: Option = { texte: 'Match fou', effetsVariance: 1 }
    const r = jouerMatchAvecOption(xi('a', 70), xi('b', 40), optionChaos, creerRng(1))
    expect(r.pronostic.victoire).toBeCloseTo(1 / 3)
    expect(r.pronostic.nul).toBeCloseTo(1 / 3)
    expect(r.pronostic.defaite).toBeCloseTo(1 / 3)
  })
})
