import { describe, it, expect } from 'vitest'
import { creerPartie, terminerSaison, genererOffres, accepterOffre } from './carriere'
import { genererEffectif } from '../generation/genererEffectif'
import { creerRng } from './rng'
import type { Bilan, Club, Couleurs } from './types'

const couleurs: Couleurs = { principale: '#000000', secondaire: '#FFFFFF' }
function club(id: string, prestige: number): Club {
  return { id, nom: id, championnat: 'France', prestige, budget: 10, couleurs }
}
const clubsTest: Club[] = [
  club('modeste', 36),
  club('petit', 48),
  club('moyen', 62),
  club('gros', 78),
  club('geant', 100),
]

// Effectif de test partagé par les deux groupes de tests.
const effectif = genererEffectif('reims', 36, creerRng(1))

describe('creerPartie', () => {
  it('démarre en saison 1 sur le bon club', () => {
    const partie = creerPartie('reims', effectif, 123)
    expect(partie.saison).toBe(1)
    expect(partie.clubId).toBe('reims')
    expect(partie.seed).toBe(123)
  })

  it('toutes les jauges démarrent à 50', () => {
    const { jauges } = creerPartie('reims', effectif, 1)
    expect(jauges).toEqual({ direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 })
  })

  it('réputation basse au départ, historique et palmarès vides', () => {
    const partie = creerPartie('reims', effectif, 1)
    expect(partie.reputation).toBeLessThan(50)
    expect(partie.historique).toEqual([])
    expect(partie.palmares).toEqual([])
  })

  it('copie l’effectif (ne partage pas la référence des données sources)', () => {
    const partie = creerPartie('reims', effectif, 1)
    expect(partie.effectif.length).toBe(effectif.length)
    expect(partie.effectif).not.toBe(effectif) // tableau différent (copie)
  })
})

describe('terminerSaison', () => {
  // Un bilan "correct" (note moyenne, pas licencié) réutilisable.
  function bilan(over: Partial<Bilan> = {}): Bilan {
    return { rangReel: 5, rangAttendu: 5, note: 5.5, licencie: false, ...over }
  }

  it('archive la saison dans l’historique', () => {
    const partie = creerPartie('reims', effectif, 1)
    const { etat } = terminerSaison(partie, bilan({ rangReel: 3, rangAttendu: 8, note: 8 }), [])
    expect(etat.historique.length).toBe(1)
    expect(etat.historique[0].saison).toBe(1)
    expect(etat.historique[0].note).toBe(8)
  })

  it('ajoute les trophées au palmarès', () => {
    const partie = creerPartie('reims', effectif, 1)
    const { etat } = terminerSaison(partie, bilan(), [{ saison: 1, competition: 'coupe_nationale' }])
    expect(etat.palmares.length).toBe(1)
    expect(etat.palmares[0].competition).toBe('coupe_nationale')
  })

  it('fait vieillir l’effectif (chacun prend un an)', () => {
    const partie = creerPartie('reims', effectif, 1)
    const avant = partie.effectif[0].age
    const { etat } = terminerSaison(partie, bilan(), [])
    expect(etat.effectif[0].age).toBe(avant + 1)
  })

  it('la réputation monte avec une bonne note, baisse avec une mauvaise', () => {
    const partie = creerPartie('reims', effectif, 1)
    const bonne = terminerSaison(partie, bilan({ note: 9 }), []).etat.reputation
    const mauvaise = terminerSaison(partie, bilan({ note: 2 }), []).etat.reputation
    expect(bonne).toBeGreaterThan(partie.reputation)
    expect(mauvaise).toBeLessThan(partie.reputation)
  })

  it('saison normale → on continue, saison incrémentée', () => {
    const partie = creerPartie('reims', effectif, 1)
    const res = terminerSaison(partie, bilan(), [])
    expect(res.finie).toBe(false)
    expect(res.etat.saison).toBe(2)
  })

  it('licencié → carrière finie, saison non incrémentée', () => {
    const partie = creerPartie('reims', effectif, 1)
    const res = terminerSaison(partie, bilan({ licencie: true }), [])
    expect(res.finie).toBe(true)
    expect(res.raison).toBe('licencie')
    expect(res.etat.saison).toBe(1)
  })

  it('5e saison atteinte → fin de carrière', () => {
    const partie = { ...creerPartie('reims', effectif, 1), saison: 5 }
    const res = terminerSaison(partie, bilan(), [])
    expect(res.finie).toBe(true)
    expect(res.raison).toBe('fin_carriere')
  })

  it('ne modifie pas l’état d’origine (fonction pure)', () => {
    const partie = creerPartie('reims', effectif, 1)
    terminerSaison(partie, bilan(), [{ saison: 1, competition: 'championnat' }])
    expect(partie.historique.length).toBe(0)
    expect(partie.palmares.length).toBe(0)
    expect(partie.saison).toBe(1)
  })
})

describe('genererOffres', () => {
  it('garantit toujours au moins une offre d’un club plus prestigieux (progression)', () => {
    // Petit club 'modeste' (36) : on doit pouvoir grimper → au moins une offre > 36.
    const offres = genererOffres(40, 'modeste', clubsTest, creerRng(1))
    expect(offres.some((o) => o.prestige > 36)).toBe(true)
  })

  it('réputation haute → de gros clubs dans les offres', () => {
    // rep 90, club 'moyen' → fourchette [75, 100] → "gros" (78) et "geant" (100).
    const offres = genererOffres(90, 'moyen', clubsTest, creerRng(1))
    expect(offres.some((o) => o.prestige >= 75)).toBe(true)
  })

  it('ne propose jamais le club actuel', () => {
    const offres = genererOffres(62, 'moyen', clubsTest, creerRng(1))
    expect(offres.find((o) => o.id === 'moyen')).toBeUndefined()
  })

  it('déjà au sommet (prestige 100) → aucune offre plus grosse n’est forcée', () => {
    const offres = genererOffres(100, 'geant', clubsTest, creerRng(1))
    expect(offres.some((o) => o.prestige > 100)).toBe(false)
  })

  it('ne propose pas plus de 3 offres', () => {
    const offres = genererOffres(50, 'modeste', clubsTest, creerRng(1))
    expect(offres.length).toBeLessThanOrEqual(3)
  })
})

describe('accepterOffre', () => {
  const nouvelEffectif = genererEffectif('psg', 100, creerRng(2))

  it('change de club et remet les jauges à 50', () => {
    const partie = creerPartie('reims', effectif, 1)
    const apres = accepterOffre(partie, 'psg', nouvelEffectif)
    expect(apres.clubId).toBe('psg')
    expect(apres.jauges).toEqual({ direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 })
    expect(apres.effectif[0].id).toContain('psg')
  })

  it('conserve réputation, palmarès et historique', () => {
    const partie = { ...creerPartie('reims', effectif, 1), reputation: 70 }
    const apres = accepterOffre(partie, 'psg', nouvelEffectif)
    expect(apres.reputation).toBe(70)
    expect(apres.palmares).toBe(partie.palmares)
    expect(apres.historique).toBe(partie.historique)
  })
})
