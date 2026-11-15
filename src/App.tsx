import { useState } from 'react'
import { ChoixClub } from './ui/ChoixClub'
import { HubSaison } from './ui/HubSaison'
import { EcranMatch } from './ui/EcranMatch'
import { EcranBilan } from './ui/EcranBilan'
import { EcranOffres } from './ui/EcranOffres'
import { creerPartie, terminerSaison, genererOffres, accepterOffre } from './game/carriere'
import { creerRng } from './game/rng'
import { CLUBS } from './data/clubs'
import { EFFECTIFS } from './data/effectifs'
import type { GameState, Jauges, ResultatRencontre, Bilan, Trophee, Club } from './game/types'
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
  // resultatsSaison : nos résultats des matchs clés déjà joués cette saison
  // (serviront à construire le classement au bilan).
  const [resultatsSaison, setResultatsSaison] = useState<ResultatRencontre[]>([])
  // carriereFinie : vrai quand la carrière est terminée (licencié ou 5 saisons).
  const [carriereFinie, setCarriereFinie] = useState(false)
  // offres : les clubs qui nous font une offre à l'intersaison (vide = aucune).
  // enOffres : affiche-t-on l'écran d'intersaison (offres) ?
  const [offres, setOffres] = useState<Club[]>([])
  const [enOffres, setEnOffres] = useState(false)

  // Appelée quand on clique un club : on crée la partie et on remet les compteurs
  // de saison à zéro (journée 1, aucun résultat encore).
  // Date.now() sert de graine (seed) : une valeur différente à chaque lancement.
  function demarrer(clubId: string) {
    const nouvellePartie = creerPartie(clubId, EFFECTIFS[clubId], Date.now())
    setPartie(nouvellePartie)
    setJournee(1)
    setResultatsSaison([])
  }

  // Fin d'un match : on enregistre les nouvelles jauges + notre résultat, on revient
  // au hub, et on passe à la journée suivante. { ...partie, jauges } = une COPIE de
  // la partie avec seulement les jauges remplacées (on ne modifie jamais l'original).
  function finDeMatch(nouvellesJauges: Jauges, rencontre: ResultatRencontre) {
    if (partie !== undefined) {
      setPartie({ ...partie, jauges: nouvellesJauges })
    }
    setResultatsSaison([...resultatsSaison, rencontre])
    setEnMatch(false)
    setJournee(journee + 1)
  }

  // Clôture de saison (appelée depuis l'écran de bilan). On ajoute le titre de
  // champion au palmarès si on finit 1er, on applique la transition (vieillissement,
  // réputation...), puis soit la carrière est finie, soit on repart une saison.
  function terminerLaSaison(bilan: Bilan) {
    if (partie === undefined) {
      return
    }
    const trophees: Trophee[] = []
    if (bilan.rangReel === 1) {
      trophees.push({ saison: partie.saison, competition: 'championnat' })
    }

    const resultat = terminerSaison(partie, bilan, trophees)
    setPartie(resultat.etat)
    if (resultat.finie) {
      setCarriereFinie(true)
    } else {
      // Pas finie → intersaison : on génère les offres (selon la nouvelle réputation)
      // et on affiche l'écran d'offres.
      const rng = creerRng(resultat.etat.seed + resultat.etat.saison)
      setOffres(genererOffres(resultat.etat.reputation, resultat.etat.clubId, CLUBS, rng))
      setEnOffres(true)
    }
  }

  // Choix fait à l'intersaison : 'rester' au club, ou l'id d'un club dont on accepte
  // l'offre. Puis on démarre la saison suivante (journée 1, résultats vidés).
  function choisirOffre(choix: string) {
    if (partie !== undefined && choix !== 'rester') {
      // On change de club : nouvel effectif, jauges remises à neuf (voir accepterOffre).
      setPartie(accepterOffre(partie, choix, EFFECTIFS[choix]))
    }
    // on repart pour une nouvelle saison (journée 1, résultats vidés) et on quitte l'écran d'offres.
    setEnOffres(false)
    setJournee(1)
    setResultatsSaison([])
  }

  // Repartir d'une nouvelle carrière : on remet tous les états à leur valeur initiale.
  function rejouer() {
    setPartie(undefined)
    setCarriereFinie(false)
    setEnMatch(false)
    setEnOffres(false)
    setEcranChoix(false)
    setJournee(1)
    setResultatsSaison([])
  }

  // 1) Une partie est en cours.
  if (partie !== undefined) {
    // 1a) Carrière terminée → écran de fin (placeholder, enrichi à l'étape suivante).
    if (carriereFinie) {
      return (
        <main className="app">
          <h1 className="app__titre">Carrière terminée</h1>
          <p className="app__sous-titre">
            {partie.saison} saison(s) jouée(s) · {partie.palmares.length} trophée(s) ·
            réputation {partie.reputation}
          </p>
          <button type="button" className="app__cta" onClick={rejouer}>
            Rejouer
          </button>
        </main>
      )
    }
    // 1a bis) Intersaison → écran des offres (rester ou changer de club).
    if (enOffres) {
      return <EcranOffres etat={partie} offres={offres} onChoisir={choisirOffre} />
    }
    // 1b) On joue un match → l'écran de match.
    if (enMatch) {
      return <EcranMatch partie={partie} journee={journee} onContinuer={finDeMatch} />
    }
    // 1c) Tous les matchs clés joués → écran de bilan de saison.
    if (journee > NB_MATCHS_CLES) {
      return (
        <EcranBilan partie={partie} resultatsSaison={resultatsSaison} onTerminer={terminerLaSaison} />
      )
    }
    // 1d) Sinon → le hub de saison.
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
