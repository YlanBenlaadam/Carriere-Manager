import { describe, it, expect } from 'vitest'
import { raconterMatch } from './recit'
import type { MatchResult, Player, Pronostic } from './types'

const pronosticBidon: Pronostic = { victoire: 0.33, nul: 0.34, defaite: 0.33 }

function joueur(id: string, prenom: string, nom: string): Player {
  return {
    id,
    prenom,
    nom,
    age: 25,
    poste: 'M',
    niveau: 50,
    potentiel: 50,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
  }
}

// Deux joueurs : Dupont a la meilleure note, donc homme du match.
const joueurs = [joueur('p1', 'Jean', 'Dupont'), joueur('p2', 'Paul', 'Martin')]

function resultat(butsPour: number, butsContre: number): MatchResult {
  return {
    butsPour,
    butsContre,
    pronostic: pronosticBidon,
    notes: { p1: 8.5, p2: 6 },
  }
}

describe('raconterMatch', () => {
  it('victoire courte 3-0 → contient "Victoire" et "3-0"', () => {
    const texte = raconterMatch(resultat(3, 0), joueurs)
    expect(texte).toContain('Victoire')
    expect(texte).toContain('3-0')
  })

  it('victoire large 4-0 → contient "écrasante"', () => {
    expect(raconterMatch(resultat(4, 0), joueurs)).toContain('écrasante')
  })

  it('score égal 1-1 → contient "nul"', () => {
    expect(raconterMatch(resultat(1, 1), joueurs)).toContain('nul')
  })

  it('défaite 0-2 → contient "Défaite"', () => {
    expect(raconterMatch(resultat(0, 2), joueurs)).toContain('Défaite')
  })

  it('cite bien l’homme du match (meilleure note)', () => {
    const texte = raconterMatch(resultat(2, 1), joueurs)
    expect(texte).toContain('Dupont')
    expect(texte).toContain('8.5')
  })
})
