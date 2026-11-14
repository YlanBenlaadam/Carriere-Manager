import type { Choice } from '../game/types'
import choixJson from './choix.json'

// Les choix du jeu vivent en JSON (contenu éditable sans toucher au code). On les
// expose typés en Choice[]. Comme pour les clubs, le double cast est nécessaire car
// TypeScript lit le JSON avec des types larges ; un test valide le contenu.
export const CHOIX: Choice[] = choixJson as unknown as Choice[]
