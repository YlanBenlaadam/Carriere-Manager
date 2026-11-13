import type { Club } from '../game/types'
import clubsJson from './clubs.json'

// Les clubs vivent en JSON (contenu éditable sans toucher au code). On les expose
// ici typés en Club[]. Le double cast (unknown → Club[]) est nécessaire car
// TypeScript lit le JSON avec des types larges (ex. "championnat" vu comme string
// et non comme l'union exacte). Le fichier clubs.test.ts valide que le contenu
// est bien conforme, ce qui compense l'absence de vérification au chargement.
export const CLUBS: Club[] = clubsJson as unknown as Club[]
