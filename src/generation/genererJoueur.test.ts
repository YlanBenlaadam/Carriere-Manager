import { describe, it, expect } from 'vitest'
import { genererJoueur } from './genererJoueur'
import { creerRng } from '../game/rng'
import { PRENOMS, NOMS } from './noms'

describe('genererJoueur', () => {
  it('respecte l’id et le poste demandés', () => {
    const j = genererJoueur({ id: 'p1', poste: 'A', niveauMoyen: 60 }, creerRng(1))
    expect(j.id).toBe('p1')
    expect(j.poste).toBe('A')
  })

  it('reproductibilité : même seed → même joueur', () => {
    const a = genererJoueur({ id: 'p1', poste: 'M', niveauMoyen: 60 }, creerRng(42))
    const b = genererJoueur({ id: 'p1', poste: 'M', niveauMoyen: 60 }, creerRng(42))
    expect(a).toEqual(b)
  })

  it('le prénom et le nom viennent bien des réservoirs', () => {
    const j = genererJoueur({ id: 'p1', poste: 'D', niveauMoyen: 60 }, creerRng(7))
    expect(PRENOMS).toContain(j.prenom)
    expect(NOMS).toContain(j.nom)
  })

  // On teste les invariants sur BEAUCOUP de joueurs (plusieurs seeds), car les
  // valeurs sont aléatoires : un seul tirage ne prouverait rien.
  it('toutes les stats restent dans leurs bornes, quel que soit le hasard', () => {
    for (let seed = 0; seed < 200; seed++) {
      const j = genererJoueur({ id: 'x', poste: 'M', niveauMoyen: 60 }, creerRng(seed))
      expect(j.age).toBeGreaterThanOrEqual(17)
      expect(j.age).toBeLessThanOrEqual(34)
      expect(j.niveau).toBeGreaterThanOrEqual(30)
      expect(j.niveau).toBeLessThanOrEqual(95)
      expect(j.potentiel).toBeGreaterThanOrEqual(j.niveau) // jamais sous le niveau
      expect(j.potentiel).toBeLessThanOrEqual(99)
      expect(j.mental).toBeGreaterThanOrEqual(30)
      expect(j.mental).toBeLessThanOrEqual(90)
      expect(j.fraicheur).toBeGreaterThanOrEqual(85)
      expect(j.fraicheur).toBeLessThanOrEqual(100)
      expect(j.moral).toBeGreaterThanOrEqual(50)
      expect(j.moral).toBeLessThanOrEqual(70)
      expect([1, -1]).toContain(j.forme)
      expect(['apte', 'incertain', 'blesse']).toContain(j.statut)
      expect(j.finContrat).toBeGreaterThanOrEqual(2)
      expect(j.finContrat).toBeLessThanOrEqual(5)
    }
  })

  it('fait émerger quelques pépites : des jeunes au potentiel très supérieur au niveau', () => {
    // Sur un gros échantillon, on doit trouver au moins un crack : un joueur
    // jeune dont le potentiel dépasse largement son niveau de départ.
    let nbPepites = 0
    for (let seed = 0; seed < 600; seed++) {
      const j = genererJoueur({ id: 'x', poste: 'M', niveauMoyen: 55 }, creerRng(seed))
      if (j.age <= 20 && j.potentiel - j.niveau >= 20) {
        nbPepites++
      }
    }
    expect(nbPepites).toBeGreaterThan(0)
  })

  it('un club faible (niveauMoyen 45) produit des niveaux plus bas qu’un gros club (80)', () => {
    // On compare la moyenne de 100 joueurs de chaque "club" : le petit doit
    // être clairement en dessous du gros, tout en autorisant du chevauchement.
    let sommePetit = 0
    let sommeGros = 0
    for (let seed = 0; seed < 100; seed++) {
      sommePetit += genererJoueur({ id: 'x', poste: 'M', niveauMoyen: 45 }, creerRng(seed)).niveau
      sommeGros += genererJoueur({ id: 'x', poste: 'M', niveauMoyen: 80 }, creerRng(seed)).niveau
    }
    expect(sommePetit / 100).toBeLessThan(sommeGros / 100)
  })
})
