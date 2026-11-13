import type { MatchResult, Player } from './types'

export function raconterMatch(resultat: MatchResult, joueurs: Player[]): string {
  // 1) Phrase du résultat. On la STOCKE dans une variable au lieu de la renvoyer
  //    tout de suite : sinon la suite de la fonction ne s'exécuterait jamais.
  let phraseResultat: string
  if (resultat.butsPour > resultat.butsContre) {
    if (resultat.butsPour - resultat.butsContre >= 3) {
      phraseResultat = `Victoire écrasante ${resultat.butsPour}-${resultat.butsContre} pour votre équipe !`
    } else {
      phraseResultat = `Victoire ${resultat.butsPour}-${resultat.butsContre} pour votre équipe !`
    }
  } else if (resultat.butsPour === resultat.butsContre) {
    phraseResultat = `Match nul ${resultat.butsPour}-${resultat.butsContre}.`
  } else {
    if (resultat.butsContre - resultat.butsPour >= 3) {
      phraseResultat = `Défaite écrasante ${resultat.butsPour}-${resultat.butsContre} pour votre équipe.`
    } else {
      phraseResultat = `Défaite ${resultat.butsPour}-${resultat.butsContre} pour votre équipe.`
    }
  }

  // 2) Homme du match : la meilleure note (patron "chercher le maximum").
  let meilleureNote = -Infinity
  let meilleurId = ''
  for (const j of joueurs) {
    if (resultat.notes[j.id] > meilleureNote) {
      meilleureNote = resultat.notes[j.id]
      meilleurId = j.id
    }
  }

  // 3) On retrouve le joueur (find peut renvoyer undefined → nom de repli),
  //    puis on assemble le récit complet.
  const homme = joueurs.find((j) => j.id === meilleurId)
  const nomHomme = homme ? `${homme.prenom} ${homme.nom}`.trim() : 'un joueur'

  return `${phraseResultat} Homme du match : ${nomHomme} (${meilleureNote}).`
}
