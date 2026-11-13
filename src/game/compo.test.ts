import { describe, it, expect } from 'vitest'
import { meilleurOnze } from './compo'
import type { Player, Poste, Statut } from './types'

function joueur(id: string, poste: Poste, niveau: number, statut: Statut = 'apte'): Player {
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
    statut,
    finContrat: 2030,
  }
}

// Un effectif de 20 joueurs (2 G, 6 D, 7 M, 5 A) avec des niveaux variés.
function effectif(): Player[] {
  const joueurs: Player[] = []
  joueurs.push(joueur('g1', 'G', 60), joueur('g2', 'G', 70))
  for (let i = 0; i < 6; i++) joueurs.push(joueur('d' + i, 'D', 50 + i))
  for (let i = 0; i < 7; i++) joueurs.push(joueur('m' + i, 'M', 50 + i))
  for (let i = 0; i < 5; i++) joueurs.push(joueur('a' + i, 'A', 50 + i))
  return joueurs
}

describe('meilleurOnze', () => {
  it('renvoie un XI de 11 : 1 G, 4 D, 4 M, 2 A', () => {
    const xi = meilleurOnze(effectif())
    const compter = (poste: Poste) => xi.filter((j) => j.poste === poste).length
    expect(xi.length).toBe(11)
    expect(compter('G')).toBe(1)
    expect(compter('D')).toBe(4)
    expect(compter('M')).toBe(4)
    expect(compter('A')).toBe(2)
  })

  it('choisit le meilleur joueur à chaque poste (par niveau)', () => {
    const xi = meilleurOnze(effectif())
    // Le gardien retenu doit être g2 (niveau 70), pas g1 (niveau 60).
    const gardien = xi.find((j) => j.poste === 'G')!
    expect(gardien.id).toBe('g2')
  })

  it('n’aligne jamais un joueur blessé', () => {
    const e = effectif()
    // On blesse le meilleur gardien (g2) : le XI doit alors prendre g1.
    const g2 = e.find((j) => j.id === 'g2')!
    g2.statut = 'blesse'
    const xi = meilleurOnze(e)
    const gardien = xi.find((j) => j.poste === 'G')!
    expect(gardien.id).toBe('g1')
  })
})
