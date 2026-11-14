// Petites fonctions d'AFFICHAGE réutilisables par plusieurs écrans.
// (On les sort ici pour ne pas les dupliquer dans chaque composant.)

// Convertit un prestige (0-100) en une note en étoiles sur 5.
// Ex. 100 → "★★★★★", 62 → "★★★☆☆". On fabrique une chaîne d'étoiles pleines (★)
// complétée par des étoiles vides (☆) jusqu'à 5.
export function etoiles(prestige: number): string {
  let pleines = Math.round(prestige / 20) // 0 à 5
  if (pleines < 1) {
    pleines = 1 // au moins une étoile, même pour les plus modestes
  }
  const vides = 5 - pleines
  // .repeat(n) répète une chaîne n fois : ici "★" pleines fois, puis "☆" vides fois.
  return '★'.repeat(pleines) + '☆'.repeat(vides)
}
