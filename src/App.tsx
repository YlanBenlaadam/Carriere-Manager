import { useState } from 'react'
import { ChoixClub } from './ui/ChoixClub'
import { HubSaison } from './ui/HubSaison'
import { EcranMatch } from './ui/EcranMatch'
import { creerPartie } from './game/carriere'
import { EFFECTIFS } from './data/effectifs'
import type { GameState, Jauges } from './game/types'
import './App.css'

// Nombre de matchs clés joués à la main dans une saison (le reste sera simulé).
const NB_MATCHS_CLES = 5

function App() {
  // useState = la "mémoire" d'un composant. React redessine l'écran à chaque fois
  // qu'on change cette mémoire. On en a deux :
  //  - ecranChoix : affiche-t-on l'écran de choix du club ? (true/false)
  //  - partie     : l'état de jeu en cours (undefined tant qu'aucun club choisi)
  // Chaque appel renvoie une paire [valeur, fonction-pour-la-changer].
  const [ecranChoix, setEcranChoix] = useState(false) // false = on commence par l'écran d'accueil, car si on avait mis true, on verrait directement l'écran de choix du club.
  const [partie, setPartie] = useState<GameState | undefined>(undefined)
  // enMatch : est-on en train de jouer un match ? (sinon on voit le hub) au depart on est  en match donc false
  //           useState(false) = on commence par le hub, pas par un match.
  const [enMatch, setEnMatch] = useState(false)
  // journee : le numéro du match clé en cours dans la saison (1 à NB_MATCHS_CLES).
  const [journee, setJournee] = useState(1)

  // Appelée quand on clique un club : on crée la partie et on la mémorise.
  // Date.now() sert de graine (seed) : une valeur différente à chaque lancement.
  function demarrer(clubId: string) {
    const nouvellePartie = creerPartie(clubId, EFFECTIFS[clubId], Date.now())
    setPartie(nouvellePartie)
  }

  // Fin d'un match : on enregistre les nouvelles jauges, on revient au hub, et on
  // passe à la journée suivante. { ...partie, jauges } = une COPIE de la partie avec
  // seulement les jauges remplacées (on ne modifie jamais l'objet existant).
  function finDeMatch(nouvellesJauges: Jauges) {
    if (partie !== undefined) {
      setPartie({ ...partie, jauges: nouvellesJauges })
    }
    setEnMatch(false)
    setJournee(journee + 1)
  }

  // 1) Une partie est en cours.
  if (partie !== undefined) {
    // 1a) Si on joue un match → l'écran de match ; sinon → le hub de saison.
    if (enMatch) {
      return <EcranMatch partie={partie} journee={journee} onContinuer={finDeMatch} />
    }
    return (
      <HubSaison
        partie={partie}
        journee={journee}
        nbMatchs={NB_MATCHS_CLES}
        onJouer={() => setEnMatch(true)}
      />
    )
  }

  // 2) On a cliqué "Nouvelle partie" → écran de choix du club.
  //    On passe la fonction demarrer en prop : ChoixClub l'appellera au clic.
  if (ecranChoix) {
    return <ChoixClub onChoisir={demarrer} />
  }

  // 3) Par défaut : l'écran d'accueil. Le bouton fait passer à l'écran de choix.
  return (
    <main className="app">
      <h1 className="app__titre">Carrière Manager</h1>
      <p className="app__sous-titre">
        Prends les rênes d'un club et écris ta légende, saison après saison.
      </p>
      <button type="button" className="app__cta" onClick={() => setEcranChoix(true)}>
        Nouvelle partie
      </button>
    </main>
  )
}

export default App
