import { useState } from 'react'
import { ChoixClub } from './ui/ChoixClub'
import { HubSaison } from './ui/HubSaison'
import { EcranMatch } from './ui/EcranMatch'
import { EcranBilan } from './ui/EcranBilan'
import { EcranOffres } from './ui/EcranOffres'
import { EcranFinCarriere } from './ui/EcranFinCarriere'
import { creerPartie, terminerSaison, genererOffres, accepterOffre } from './game/carriere'
import { competitionEuropeenne, choisirAdversaireFinale } from './game/coupe'
import { creerRng } from './game/rng'
import { CLUBS } from './data/clubs'
import { EFFECTIFS } from './data/effectifs'
import type { GameState, Jauges, ResultatRencontre, Bilan, Trophee, Club, Finale } from './game/types'
import './App.css'

// Nombre de matchs de CHAMPIONNAT joués à la main dans une saison (le reste simulé).
const NB_MATCHS_CLES = 1

// Construit les finales de coupe de la saison (jouées après les matchs de championnat).
// Toujours la coupe nationale ; + une coupe d'Europe selon le niveau du club.
function construireFinales(partie: GameState): Finale[] {
  const club = CLUBS.find((c) => c.id === partie.clubId)!
  const rng = creerRng(partie.seed + partie.saison * 7)
  const finales: Finale[] = []

  // Coupe nationale : tout le monde la joue. Le drapeau du pays est ajouté à
  // l'affichage par EcranMatch (dessiné en CSS), on garde donc un titre simple.
  const advCoupe = choisirAdversaireFinale('coupe_nationale', club, CLUBS, rng)
  finales.push({
    competition: 'coupe_nationale',
    adversaireId: advCoupe.id,
    titre: 'Finale — Coupe nationale',
  })

  // Coupe d'Europe selon le prestige : Ligue des Champions, Europa League, ou aucune.
  const euro = competitionEuropeenne(club.prestige)
  if (euro !== null) {
    const advEuro = choisirAdversaireFinale(euro, club, CLUBS, rng)
    let titre = 'Finale — Europa League'
    if (euro === 'ldc') {
      titre = 'Finale — Ligue des Champions'
    }
    finales.push({ competition: euro, adversaireId: advEuro.id, titre })
  }

  return finales
}

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
  // raisonFin : pourquoi la carrière s'est terminée (pour l'écran de fin).
  const [raisonFin, setRaisonFin] = useState<'licencie' | 'fin_carriere' | null>(null)
  // offres : les clubs qui nous font une offre à l'intersaison (vide = aucune).
  // enOffres : affiche-t-on l'écran d'intersaison (offres) ?
  const [offres, setOffres] = useState<Club[]>([])
  const [enOffres, setEnOffres] = useState(false)
  // tropheesSaison : trophées de coupe gagnés cette saison (ajoutés au palmarès au bilan).
  const [tropheesSaison, setTropheesSaison] = useState<Trophee[]>([])

  // Les finales de la saison (déterministes à partir de la partie) et le total de
  // matchs clés (championnat + finales). journée > ce total → on va au bilan.
  // en gros les finales sont calculées à partir de la partie (club, graine, saison) 
  // et le total de matchs est le nombre de matchs clés + le nombre de finales.
  const finales = partie !== undefined ? construireFinales(partie) : []
  const totalMatchs = NB_MATCHS_CLES + finales.length

  // Appelée quand on clique un club : on crée la partie et on remet les compteurs
  // de saison à zéro (journée 1, aucun résultat encore).
  // Date.now() sert de graine (seed) : une valeur différente à chaque lancement.
  function demarrer(clubId: string) {
    const nouvellePartie = creerPartie(clubId, EFFECTIFS[clubId], Date.now())
    setPartie(nouvellePartie)
    setJournee(1)
    setResultatsSaison([])
    setTropheesSaison([])
  }

  // Fin d'un match : on enregistre les nouvelles jauges + notre résultat, on revient
  // au hub, et on passe à la journée suivante. { ...partie, jauges } = une COPIE de
  // la partie avec seulement les jauges remplacées (on ne modifie jamais l'original).
  function finDeMatch(nouvellesJauges: Jauges, rencontre: ResultatRencontre, gagne: boolean) {
    if (partie !== undefined) {
      setPartie({ ...partie, jauges: nouvellesJauges })
    }

    if (journee <= NB_MATCHS_CLES) {
      // Match de championnat → son résultat compte pour le classement.
      setResultatsSaison([...resultatsSaison, rencontre])
    } else if (gagne && partie !== undefined) {
      // Finale de coupe gagnée → un trophée pour le palmarès.
      const finale = finales[journee - NB_MATCHS_CLES - 1]
      setTropheesSaison([...tropheesSaison, { saison: partie.saison, competition: finale.competition }])
    }

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
    // Trophées de la saison : les coupes gagnées + le titre de champion si on finit 1er.
    const trophees: Trophee[] = [...tropheesSaison]
    if (bilan.rangReel === 1) {
      trophees.push({ saison: partie.saison, competition: 'championnat' })
    }

    const resultat = terminerSaison(partie, bilan, trophees)
    setPartie(resultat.etat)
    if (resultat.finie) {
      setRaisonFin(resultat.raison)
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
    // on repart pour une nouvelle saison (journée 1, résultats + trophées vidés).
    setEnOffres(false)
    setJournee(1)
    setResultatsSaison([])
    setTropheesSaison([])
  }

  // Repartir d'une nouvelle carrière : on remet tous les états à leur valeur initiale.
  function rejouer() {
    setPartie(undefined)
    setCarriereFinie(false)
    setRaisonFin(null)
    setEnMatch(false)
    setEnOffres(false)
    setEcranChoix(false)
    setJournee(1)
    setResultatsSaison([])
    setTropheesSaison([])
  }

  // 1) Une partie est en cours.
  if (partie !== undefined) {
    // 1a) Carrière terminée → écran de fin (bilan global + partage).
    if (carriereFinie) {
      return <EcranFinCarriere partie={partie} raison={raisonFin} onRejouer={rejouer} />
    }
    // 1a bis) Intersaison → écran des offres (rester ou changer de club).
    if (enOffres) {
      return <EcranOffres etat={partie} offres={offres} onChoisir={choisirOffre} />
    }
    // 1b) On joue un match. Si la journée dépasse le championnat, c'est une FINALE :
    //     on passe la finale correspondante à l'écran de match (adversaire + thème).
    if (enMatch) {
      let finaleDuMatch: Finale | undefined = undefined
      if (journee > NB_MATCHS_CLES) {
        finaleDuMatch = finales[journee - NB_MATCHS_CLES - 1]
      }
      return (
        <EcranMatch
          partie={partie}
          journee={journee}
          finale={finaleDuMatch}
          onContinuer={finDeMatch}
        />
      )
    }
    // 1c) Championnat ET finales joués → écran de bilan de saison.
    if (journee > totalMatchs) {
      return (
        <EcranBilan
          partie={partie}
          resultatsSaison={resultatsSaison}
          tropheesSaison={tropheesSaison}
          onTerminer={terminerLaSaison}
        />
      )
    }
    // 1d) Sinon → le hub de saison. Le libellé du bouton dépend du prochain match
    //     (match de championnat numéroté, ou finale de coupe).
    //      finales[journee - NB_MATCHS_CLES - 1] = la finale correspondante à la journée (si on est dans les finales).
    //      explication du calcul du label : si la journée est supérieure au nombre de matchs clés, 
    //      on est dans les finales, donc on affiche le titre de la finale correspondante. 
    //      Sinon, on affiche "Jouer le match clé X / NB_MATCHS_CLES".
    // le tableau finales contient les finales de coupe de la saison, 
    // et on calcule l'index de la finale correspondante à la journée actuelle en soustrayant NB_MATCHS_CLES + 1 (car les indices commencent à 0).
    let labelProchain = `Jouer le match clé ${journee} / ${NB_MATCHS_CLES}`
    if (journee > NB_MATCHS_CLES) {
      labelProchain = finales[journee - NB_MATCHS_CLES - 1].titre
    }
    return (
      <HubSaison partie={partie} labelBouton={labelProchain} onJouer={() => setEnMatch(true)} />
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
