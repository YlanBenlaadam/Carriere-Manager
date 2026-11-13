import { describe, it, expect } from 'vitest'
import {
  conditionRemplie,
  choixEligibles,
  tirerChoix,
  appliquerEffetsJauges,
  resoudreChoix,
  appliquerEffetsJoueur,
  appliquerEffetsForces,
  appliquerVariance,
} from './choix'
import type { Choice, Forces, GameState, Jauges, Player, Poste, Pronostic, Statut } from './types'
import type { Rng } from './rng'

function rngFixe(valeur: number): Rng {
  return () => valeur
}

function joueur(id: string, poste: Poste, statut: Statut = 'apte'): Player {
  return {
    id,
    prenom: '',
    nom: '',
    age: 25,
    poste,
    niveau: 50,
    potentiel: 50,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut,
    finContrat: 2030,
  }
}

// Fabrique un GameState minimal, avec seulement ce qui nous intéresse en surcharge.
function etat(over: {
  saison?: number
  reputation?: number
  jauges?: Partial<Jauges>
}): GameState {
  return {
    seed: 1,
    saison: over.saison ?? 1,
    clubId: 'c1',
    jauges: {
      direction: 50,
      vestiaire: 50,
      fans: 50,
      tresorerie: 50,
      ...over.jauges,
    },
    effectif: [],
    historique: [],
    palmares: [],
    reputation: over.reputation ?? 50,
  }
}

describe('conditionRemplie', () => {
  it('jauge.vestiaire < 45, vestiaire=30 → true', () => {
    expect(
      conditionRemplie({ cible: 'jauge.vestiaire', op: '<', valeur: 45 }, etat({ jauges: { vestiaire: 30 } })),
    ).toBe(true)
  })

  it('jauge.vestiaire < 45, vestiaire=60 → false', () => {
    expect(
      conditionRemplie({ cible: 'jauge.vestiaire', op: '<', valeur: 45 }, etat({ jauges: { vestiaire: 60 } })),
    ).toBe(false)
  })

  it('saison >= 2, saison=1 → false', () => {
    expect(conditionRemplie({ cible: 'saison', op: '>=', valeur: 2 }, etat({ saison: 1 }))).toBe(false)
  })

  it('reputation == 50, reputation=50 → true', () => {
    expect(conditionRemplie({ cible: 'reputation', op: '==', valeur: 50 }, etat({ reputation: 50 }))).toBe(true)
  })

  it('cible inconnue → lève une erreur', () => {
    expect(() => conditionRemplie({ cible: 'inexistante', op: '<', valeur: 1 }, etat({}))).toThrow()
  })
})

// Trois choix pour tester le filtrage.
const choixVestiaire: Choice = {
  id: 'c_vest',
  famille: 'gestion_humaine',
  conditions: [{ cible: 'jauge.vestiaire', op: '<', valeur: 45 }],
  texte: '',
  options: [],
}
const choixSaison5: Choice = {
  id: 'c_s5',
  famille: 'contexte',
  conditions: [{ cible: 'saison', op: '>=', valeur: 5 }],
  texte: '',
  options: [],
}
const choixFallback: Choice = {
  id: 'c_fb',
  famille: 'tactique',
  conditions: [],
  texte: '',
  options: [],
}

describe('choixEligibles', () => {
  it('garde les choix dont toutes les conditions passent', () => {
    const state = etat({ saison: 1, jauges: { vestiaire: 30 } })
    const eligibles = choixEligibles([choixVestiaire, choixSaison5, choixFallback], state)
    const ids = eligibles.map((c) => c.id)
    expect(ids).toContain('c_vest') // vestiaire 30 < 45 ✓
    expect(ids).toContain('c_fb') // sans condition → toujours éligible
    expect(ids).not.toContain('c_s5') // saison 1 < 5 ✗
  })

  it('un choix sans condition est toujours éligible', () => {
    expect(choixEligibles([choixFallback], etat({})).length).toBe(1)
  })
})

describe('tirerChoix', () => {
  it('rng=0 → premier choix du vivier', () => {
    expect(tirerChoix([choixVestiaire, choixFallback], rngFixe(0))?.id).toBe('c_vest')
  })

  it('rng=0.99 → dernier choix du vivier', () => {
    expect(tirerChoix([choixVestiaire, choixFallback], rngFixe(0.99))?.id).toBe('c_fb')
  })

  it('vivier vide → undefined', () => {
    expect(tirerChoix([], rngFixe(0))).toBeUndefined()
  })
})

describe('appliquerEffetsJauges', () => {
  const base: Jauges = { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 }

  it('applique les deltas et laisse les jauges non citées inchangées', () => {
    expect(appliquerEffetsJauges(base, { vestiaire: 10, direction: -5 })).toEqual({
      direction: 45,
      vestiaire: 60,
      fans: 50,
      tresorerie: 50,
    })
  })

  it('borne en haut à 100', () => {
    expect(appliquerEffetsJauges({ ...base, vestiaire: 95 }, { vestiaire: 10 }).vestiaire).toBe(100)
  })

  it('borne en bas à 0', () => {
    expect(appliquerEffetsJauges({ ...base, direction: 3 }, { direction: -10 }).direction).toBe(0)
  })

  it('aucun effet → jauges identiques', () => {
    expect(appliquerEffetsJauges(base, {})).toEqual(base)
  })

  it('ne modifie pas l’objet d’origine (fonction pure)', () => {
    appliquerEffetsJauges(base, { vestiaire: 10 })
    expect(base.vestiaire).toBe(50)
  })
})

describe('resoudreChoix', () => {
  // Martin est incertain, Dupont est l'attaquant, les autres sont aptes.
  const effectif: Player[] = [
    joueur('martin', 'D', 'incertain'),
    joueur('dupont', 'A'),
    joueur('durand', 'M'),
  ]

  const choixBlesse: Choice = {
    id: 'c_blesse',
    famille: 'gestion_humaine',
    conditions: [],
    texte: '',
    options: [{ texte: 'Le faire jouer', effetsJoueur: { cible: 'le_blesse', statut: 'blesse' } }],
  }

  it('fige le rôle "le_blesse" sur le joueur incertain', () => {
    const resolu = resoudreChoix(choixBlesse, effectif, rngFixe(0))
    expect(resolu.cibles['le_blesse']).toBe('martin')
  })

  it('fige "titulaire_pointe" sur un attaquant', () => {
    const choix: Choice = {
      id: 'c_pointe',
      famille: 'composition',
      conditions: [],
      texte: '',
      options: [{ texte: 'Titulariser', effetsJoueur: { cible: 'titulaire_pointe', moral: 5 } }],
    }
    expect(resoudreChoix(choix, effectif, rngFixe(0)).cibles['titulaire_pointe']).toBe('dupont')
  })

  it('aucun rôle visé → cibles vide', () => {
    const choix: Choice = {
      id: 'c_simple',
      famille: 'tactique',
      conditions: [],
      texte: '',
      options: [{ texte: 'Jouer offensif', effetsForces: { attaque: 1.1 } }],
    }
    expect(resoudreChoix(choix, effectif, rngFixe(0)).cibles).toEqual({})
  })

  it('rôle sans candidat (aucun incertain) → non mémorisé', () => {
    const sansBlesse = [joueur('dupont', 'A'), joueur('durand', 'M')]
    const resolu = resoudreChoix(choixBlesse, sansBlesse, rngFixe(0))
    expect(resolu.cibles['le_blesse']).toBeUndefined()
  })
})

describe('appliquerEffetsJoueur', () => {
  it('applique les effets au joueur figé, laisse les autres intacts', () => {
    const effectif: Player[] = [joueur('martin', 'D', 'incertain'), joueur('durand', 'M')]
    const apres = appliquerEffetsJoueur(
      effectif,
      { cible: 'le_blesse', statut: 'blesse', moral: -10 },
      { le_blesse: 'martin' },
    )
    const martin = apres.find((p) => p.id === 'martin')!
    const durand = apres.find((p) => p.id === 'durand')!
    expect(martin.statut).toBe('blesse')
    expect(martin.moral).toBe(40) // 50 - 10
    expect(durand.moral).toBe(50) // inchangé
  })

  it('borne le moral dans [0, 100]', () => {
    const effectif: Player[] = [{ ...joueur('m', 'D'), moral: 5 }]
    const apres = appliquerEffetsJoueur(effectif, { cible: 'le_blesse', moral: -50 }, { le_blesse: 'm' })
    expect(apres[0].moral).toBe(0)
  })

  it('rôle non résolu (absent de cibles) → effectif inchangé', () => {
    const effectif: Player[] = [joueur('m', 'D')]
    const apres = appliquerEffetsJoueur(effectif, { cible: 'le_blesse', moral: -10 }, {})
    expect(apres).toEqual(effectif)
  })

  it('ne modifie pas le joueur d’origine (fonction pure)', () => {
    const martin = joueur('martin', 'D', 'incertain')
    appliquerEffetsJoueur([martin], { cible: 'le_blesse', statut: 'blesse' }, { le_blesse: 'martin' })
    expect(martin.statut).toBe('incertain')
  })
})

describe('appliquerEffetsForces', () => {
  const forces: Forces = { attaque: 50, defense: 60 }

  it('multiplie les secteurs cités par leur coefficient', () => {
    // 50 * 1.1 = 55 (en flottant ça donne 55.0000001 → toBeCloseTo)
    const r = appliquerEffetsForces(forces, { attaque: 1.1 })
    expect(r.attaque).toBeCloseTo(55)
    expect(r.defense).toBe(60)
  })

  it('secteur non cité → coefficient 1 (inchangé)', () => {
    expect(appliquerEffetsForces(forces, {})).toEqual(forces)
  })

  it('peut affaiblir un secteur (coefficient < 1)', () => {
    expect(appliquerEffetsForces(forces, { defense: 0.5 })).toEqual({ attaque: 50, defense: 30 })
  })
})

describe('appliquerVariance', () => {
  const prono: Pronostic = { victoire: 0.6, nul: 0.25, defaite: 0.15 }

  it('variance 0 → pronostic inchangé', () => {
    expect(appliquerVariance(prono, 0)).toEqual(prono)
  })

  it('variance 1 → tout à 1/3', () => {
    const r = appliquerVariance(prono, 1)
    expect(r.victoire).toBeCloseTo(1 / 3)
    expect(r.nul).toBeCloseTo(1 / 3)
    expect(r.defaite).toBeCloseTo(1 / 3)
  })

  it('variance intermédiaire → se rapproche de l’équilibre mais la somme reste 1', () => {
    const r = appliquerVariance(prono, 0.5)
    // la victoire (0.6) baisse vers 1/3, la défaite (0.15) remonte vers 1/3
    expect(r.victoire).toBeLessThan(0.6)
    expect(r.defaite).toBeGreaterThan(0.15)
    expect(r.victoire + r.nul + r.defaite).toBeCloseTo(1)
  })
})
