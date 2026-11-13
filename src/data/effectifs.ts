import type { Player } from '../game/types'
import effectifsJson from './effectifs.json'

// Les effectifs générés hors-ligne (voir scripts/genererEffectifs.ts), exposés
// typés : un dictionnaire { idDuClub: [ses joueurs] }. Même logique de cast que
// pour les clubs (le JSON est lu avec des types larges par TypeScript).
export const EFFECTIFS: Record<string, Player[]> = effectifsJson as unknown as Record<string, Player[]>
