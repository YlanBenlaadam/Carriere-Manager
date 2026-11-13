import type { Rencontre } from './types'

// Génère toutes les rencontres d'un championnat simple : chaque club affronte
// chaque autre UNE seule fois. Pour N clubs, ça fait N*(N-1)/2 rencontres
// (ex. 10 clubs → 45 rencontres).
export function genererCalendrier(clubIds: string[]): Rencontre[] {
  const rencontres: Rencontre[] = []

  // Boucle extérieure : chaque club joue le rôle de l'équipe "à domicile".
  for (let i = 0; i < clubIds.length; i++) {
    // Boucle intérieure : on démarre à i + 1 pour n'affronter que les clubs qui
    // VIENNENT APRÈS dans la liste. C'est ce qui évite deux choses :
    //   - les doublons : on ne crée jamais A-B puis B-A ;
    //   - un club contre lui-même : comme j > i, on n'a jamais i === j.
    for (let j = i + 1; j < clubIds.length; j++) {
      const rencontre: Rencontre = {
        domicile: clubIds[i],
        exterieur: clubIds[j],
      }
      rencontres.push(rencontre)
    }
  }

  return rencontres
}
