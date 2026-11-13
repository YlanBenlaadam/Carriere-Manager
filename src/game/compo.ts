import type { Player, Poste } from './types'

// Sélectionne le meilleur XI (1 gardien, 4 défenseurs, 4 milieux, 2 attaquants)
// parmi un effectif, comme un coach qui aligne ses meilleurs joueurs.
//
// Rappel des types (types.ts) :
//   - Player a entre autres { poste: Poste, niveau: number, statut: Statut }
//   - Poste = 'G' | 'D' | 'M' | 'A'
//   - statut = 'apte' | 'incertain' | 'blesse'
export function meilleurOnze(effectif: Player[]): Player[] {
  // On écarte d'abord les blessés : un joueur 'blesse' ne peut pas jouer.
  const disponibles = effectif.filter((joueur) => joueur.statut !== 'blesse')

  // Petite fonction interne : renvoie les "combien" meilleurs joueurs d'un poste,
  // triés par niveau décroissant.
  function meilleursAuPoste(poste: Poste, combien: number): Player[] {
    const duPoste = disponibles.filter((joueur) => joueur.poste === poste)
    // [...duPoste] = une COPIE du tableau, car sort() modifie le tableau sur
    // lequel il s'applique : on évite ainsi de réordonner "disponibles".
    const triesDuMeilleur = [...duPoste].sort((a, b) => b.niveau - a.niveau)
    return triesDuMeilleur.slice(0, combien) // on garde les "combien" premiers
  }

  // On assemble le XI en concaténant les meilleurs de chaque poste (1-4-4-2).
  return [
    ...meilleursAuPoste('G', 1),
    ...meilleursAuPoste('D', 4),
    ...meilleursAuPoste('M', 4),
    ...meilleursAuPoste('A', 2),
  ]
}
