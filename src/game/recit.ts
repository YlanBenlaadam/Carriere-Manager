import type { MatchResult, Player, Option } from './types'

// Juge l'impact du choix fait par le joueur, selon la physionomie du match.
// On classe l'option en "risquée/offensive" (booste l'attaque ou la variance) ou
// "prudente/défensive" (booste la défense), puis on la croise avec le résultat.
// Renvoie undefined si le choix n'a pas d'impact tactique clair (choix "jauges" pur).
function commenterChoix(option: Option, resultat: MatchResult): string | undefined {
  // On lit les coefficients de l'option (1 = inchangé si absent).
  let coefAttaque = 1
  if (option.effetsForces !== undefined && option.effetsForces.attaque !== undefined) {
    coefAttaque = option.effetsForces.attaque
  }
  let coefDefense = 1
  if (option.effetsForces !== undefined && option.effetsForces.defense !== undefined) {
    coefDefense = option.effetsForces.defense
  }
  let variance = 0
  if (option.effetsVariance !== undefined) {
    variance = option.effetsVariance
  }

  // Offensif/risqué : on a boosté l'attaque OU augmenté la variance.
  const risque = coefAttaque > 1 || variance > 0
  // Prudent : on a renforcé la défense sans jouer l'attaque.
  const prudent = coefDefense > 1 && coefAttaque <= 1

  if (!risque && !prudent) {
    return undefined // pas d'impact tactique → on ne commente pas
  }

  const victoire = resultat.butsPour > resultat.butsContre
  const defaite = resultat.butsPour < resultat.butsContre

  if (risque) {
    if (victoire) {
      return 'Ton pari a payé.'
    }
    if (defaite) {
      return "Ton pari s'est retourné contre toi."
    }
    return "Ta prise de risque n'a donné qu'un nul."
  }

  // Cas prudent.
  if (defaite) {
    return "Même en jouant prudent, ça n'a pas suffi."
  }
  if (victoire) {
    return 'Ton approche prudente a parfaitement tenu.'
  }
  return 'Ton approche prudente a assuré le nul.'
}

// Construit le récit du match. L'option choisie est facultative : si elle est
// fournie et qu'elle a eu un impact tactique, on ajoute une phrase qui dit si le
// choix a été fructueux ou non.
export function raconterMatch(resultat: MatchResult, joueurs: Player[], option?: Option): string {
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

  // 3) On retrouve le joueur (find peut renvoyer undefined → nom de repli).
  const homme = joueurs.find((j) => j.id === meilleurId)
  const nomHomme = homme ? `${homme.prenom} ${homme.nom}`.trim() : 'un joueur'

  // 4) On assemble : résultat, (commentaire du choix si pertinent), homme du match.
  let texte = phraseResultat
  if (option !== undefined) {
    const commentaire = commenterChoix(option, resultat)
    if (commentaire !== undefined) {
      texte = texte + ' ' + commentaire
    }
  }
  texte = texte + ` Homme du match : ${nomHomme} (${meilleureNote}).`
  return texte
}
