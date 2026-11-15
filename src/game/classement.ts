import type { ResultatRencontre, LigneClassement } from './types'

// Barème classique : 3 points pour une victoire, 1 pour un nul, 0 pour une défaite.
const POINTS_VICTOIRE = 3
const POINTS_NUL = 1

// Crée une ligne de classement vide pour un club (tout à zéro).
function ligneVide(clubId: string): LigneClassement {
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

// Calcule le classement final à partir de tous les résultats de la saison.
// On parcourt chaque match, on met à jour les deux clubs, puis on trie.
/*
  ligneVide(club) = l'état de départ (tout à 0). Elle ne sait rien du passé.
  Le dictionnaire lignes = la mémoire : il garde le même objet ligne pour un club, d'un match à l'autre, pour que les points/buts s'additionnent.
  ligneDe(club) = « donne-moi la ligne de ce club : si elle existe déjà, je continue dessus ; sinon je la crée (une seule fois) avec ligneVide ».
*/
export function calculerClassement(resultats: ResultatRencontre[]): LigneClassement[] {
  // Dictionnaire { clubId: sa ligne }, pour retrouver/mettre à jour facilement.
  // string = id du club, LigneClassement = l'état du club (points, buts, etc.) à ce moment de la saison.
  const lignes: Record<string, LigneClassement> = {}

  // Petite fonction pour récupérer la ligne d'un club, en la créant si besoin.
  function ligneDe(clubId: string): LigneClassement {
    if (lignes[clubId] === undefined) {
      lignes[clubId] = ligneVide(clubId)
    }
    return lignes[clubId]
  }

  for (const r of resultats) {
    const dom = ligneDe(r.domicile)
    const ext = ligneDe(r.exterieur)

    // Un match de plus pour chacun.
    dom.joues++
    ext.joues++

    // Les buts marqués / encaissés de chaque côté.
    dom.butsPour += r.butsDomicile
    dom.butsContre += r.butsExterieur
    ext.butsPour += r.butsExterieur
    ext.butsContre += r.butsDomicile

    // Qui a gagné ? On met à jour victoires/nuls/défaites et les points.
    if (r.butsDomicile > r.butsExterieur) {
      dom.gagnes++
      dom.points += POINTS_VICTOIRE
      ext.perdus++
    } else if (r.butsDomicile < r.butsExterieur) {
      ext.gagnes++
      ext.points += POINTS_VICTOIRE
      dom.perdus++
    } else {
      dom.nuls++
      ext.nuls++
      dom.points += POINTS_NUL
      ext.points += POINTS_NUL
    }
  }

  // On calcule la différence de buts et on transforme le dictionnaire en tableau.
  // et bien sur c'est pour chaque rencontre que l'on calcule la différence de buts pour chaque club
  const classement: LigneClassement[] = []
  for (const clubId in lignes) {
    const ligne = lignes[clubId]
    ligne.difference = ligne.butsPour - ligne.butsContre // formule simple pour la différence de buts
    classement.push(ligne)
  }

  // Tri : d'abord les points (décroissant), puis la différence de buts, puis les
  // buts marqués. sort compare deux lignes a et b : un nombre < 0 met a avant b.
  classement.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    if (b.difference !== a.difference) {
      return b.difference - a.difference
    }
    return b.butsPour - a.butsPour
  })

  return classement
}
