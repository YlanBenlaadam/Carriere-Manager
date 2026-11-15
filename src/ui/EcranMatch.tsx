import { useState } from 'react'
import { CLUBS } from '../data/clubs'
import { EFFECTIFS } from '../data/effectifs'
import { CHOIX } from '../data/choix'
import { meilleurOnze } from '../game/compo'
import { calculerForces } from '../game/force'
import { calculerPronostic } from '../game/pronostic'
import { jouerMatchAvecOption } from '../game/match'
import { raconterMatch } from '../game/recit'
import { choixEligibles, tirerChoix, appliquerEffetsJauges } from '../game/choix'
import { appliquerResultatAuxJauges } from '../game/jauges'
import { creerRng } from '../game/rng'
import type {
  GameState,
  Jauges,
  Option,
  Issue,
  MatchResult,
  Club,
  Player,
  Poste,
  Choice,
  Pronostic,
  ResultatRencontre,
  Finale,
} from '../game/types'
import './EcranMatch.css'

// Tout ce qu'on prépare AVANT que le joueur décide (calculé une seule fois).
interface SetupMatch {
  adversaire: Club
  nosTitulaires: Player[]
  titulairesAdverses: Player[]
  pronostic: Pronostic
  choix: Choice | undefined // le choix proposé (undefined si aucun éligible)
}

// Ce qu'on affiche APRÈS le coup d'envoi.
interface Resolution {
  resultat: MatchResult
  recit: string
  nouvellesJauges: Jauges
  rencontre: ResultatRencontre // notre résultat, pour le classement de fin de saison
  gagne: boolean // a-t-on gagné ? (en finale, inclut la séance de tirs au but)
  tirsAuBut: boolean // la finale s'est-elle décidée aux tirs au but (match nul) ?
}

// Prépare le match de la JOURNÉE donnée : adversaire, compositions, pronostic, choix.
// La graine dépend de la saison ET de la journée → chaque journée a son propre match
// (adversaire et tirage différents), et ça reste stable au re-render de cette journée.
// adversaireImpose : si fourni (cas d'une FINALE de coupe), c'est l'adversaire ; sinon
// on prend l'adversaire de championnat correspondant à la journée.
function preparerMatch(partie: GameState, journee: number, adversaireImpose?: string): SetupMatch {
  const rng = creerRng(partie.seed + partie.saison * 100 + journee)

  const monClub = CLUBS.find((c) => c.id === partie.clubId)!

  // Choix de l'adversaire : imposé (finale) ou tiré de la liste du championnat.
  let adversaire: Club
  if (adversaireImpose !== undefined) {
    adversaire = CLUBS.find((c) => c.id === adversaireImpose)!
  } else {
    const adversairesPossibles = CLUBS.filter(
      (c) => c.championnat === monClub.championnat && c.id !== partie.clubId,
    )
    const indexAdversaire = (journee - 1) % adversairesPossibles.length
    adversaire = adversairesPossibles[indexAdversaire]
  }

  // Compositions (meilleur XI de chaque équipe) et pronostic de base.
  // idee : plus tard faire en sorte de choisir la compos d'avant match en fonction des notes des joueurs... et sa affluera sur la note de l'equipe et donc le resultat
  const nosTitulaires = meilleurOnze(partie.effectif)
  const titulairesAdverses = meilleurOnze(EFFECTIFS[adversaire.id])
  const pronostic = calculerPronostic(
    calculerForces(nosTitulaires),
    calculerForces(titulairesAdverses),
  )

  // Choix : on filtre les choix éligibles pour l'état actuel, puis on en tire un.
  const eligibles = choixEligibles(CHOIX, partie)
  const choix = tirerChoix(eligibles, rng)

  return { adversaire, nosTitulaires, titulairesAdverses, pronostic, choix }
}

// Transforme une probabilité (0-1) en pourcentage entier affichable (ex. 0.42 → "42%").
function pourcent(p: number): string {
  return Math.round(p * 100) + '%'
}

// Renvoie 0 si la valeur est absente (undefined). Pratique pour les buts/passes :
// un joueur sans but n'a pas d'entrée dans le dictionnaire, on affiche alors 0.
function ouZero(valeur: number | undefined): number {
  if (valeur === undefined) {
    return 0
  }
  return valeur
}

// Un joueur dessiné SUR la pelouse : une pastille ronde aux COULEURS DE SON CLUB
// (fond = couleur principale, bordure = secondaire), avec son numéro dedans et son
// numéro + nom en dessous. Les badges ⚽ (buts) / 👟 (passes) s'affichent si > 0
// (côté adverse on passe 0, donc pas de badge). Les notes chiffrées sont dans le tableau.
function JoueurSurTerrain({
  numero,
  joueur,
  buts,
  passes,
  couleur,
  bordure,
}: {
  numero: number
  joueur: Player
  buts: number
  passes: number
  couleur: string // couleur principale du club
  bordure: string // couleur secondaire du club
}) {
  return (
    <div className="joueur-terrain">
      <span
        className="joueur-terrain__pastille"
        style={{ background: couleur, borderColor: bordure }}
      >
        {numero}
        {/* "condition && <élément>" = on affiche l'élément SEULEMENT si la condition
            est vraie. Ici : un badge seulement si le joueur a marqué / passé. */}
        {buts > 0 && <span className="badge badge--but">⚽{buts}</span>}
        {passes > 0 && <span className="badge badge--passe">👟{passes}</span>}
      </span>
      <span className="joueur-terrain__nom">
        {numero}. {joueur.nom}
      </span>
    </div>
  )
}

// Props : la partie en cours, et onContinuer (appelée à la fin pour revenir au hub
// avec les jauges mises à jour par le résultat).
// donc la fonction prend en paramètre un objet { partie, onContinuer } et on précise le type de cet objet.
// on continuer est une fonction qui prend un objet de type Jauges et ne renvoie rien (void)
export function EcranMatch({
  partie,
  journee,
  finale,
  onContinuer,
}: {
  partie: GameState
  journee: number // numéro du match clé dans la saison (1, 2, 3...)
  finale?: Finale // si fourni, c'est une FINALE de coupe (adversaire imposé + thème)
  onContinuer: (nouvellesJauges: Jauges, rencontre: ResultatRencontre, gagne: boolean) => void
}) {
  // Adversaire imposé si c'est une finale (sinon undefined → adversaire de championnat).
  const adversaireImpose = finale !== undefined ? finale.adversaireId : undefined

  // Thème visuel : 'championnat' par défaut, sinon la compétition de la finale.
  const theme = finale !== undefined ? finale.competition : 'championnat'
  const classeRacine = 'match match--' + theme

  // Préparation calculée UNE fois (l'initialiseur de useState ne tourne qu'au montage).
  // On ne veut pas recalculer à chaque re-render (ex. si on clique sur une option).
  //setup contient l'adversaire, les titulaires, le pronostic et le choix proposé (tt les infos necessaire) voir fct preparerMatch
  const [setup] = useState(() => preparerMatch(partie, journee, adversaireImpose))
  // Résultat : undefined tant que le match n'est pas joué, rempli après le choix.
  // cette variable(resolution) va contenir le résultat du match, le récit et les nouvelles jauges après le match
  const [resolution, setResolution] = useState<Resolution | undefined>(undefined)

  const monClub = CLUBS.find((c) => c.id === partie.clubId)!

  // Joue le match avec l'option choisie (ou undefined si pas de choix), puis calcule
  // le récit et les nouvelles jauges. C'est le moment du tirage (une seule fois).
  function jouer(option: Option | undefined) {
    // Graine dédiée au tirage, propre à cette saison ET cette journée.
    const rng = creerRng(partie.seed + partie.saison * 100 + journee + 777)
    const resultat = jouerMatchAvecOption(setup.nosTitulaires, setup.titulairesAdverses, option, rng)
    // On passe l'option choisie au récit : il pourra dire si le choix a payé ou non.
    const recit = raconterMatch(resultat, setup.nosTitulaires, option)

    // Issue (V/N/D) déduite du score, pour faire réagir les jauges.
    let issue: Issue = 'nul'
    if (resultat.butsPour > resultat.butsContre) {
      issue = 'victoire'
    } else if (resultat.butsPour < resultat.butsContre) {
      issue = 'defaite'
    }

    // Jauges : d'abord l'effet du résultat, puis l'effet éventuel de l'option choisie.
    let nouvellesJauges = appliquerResultatAuxJauges(partie.jauges, issue)
    if (option !== undefined && option.effetsJauges !== undefined) {
      nouvellesJauges = appliquerEffetsJauges(nouvellesJauges, option.effetsJauges)
    }

    // Notre résultat, formaté pour le classement : notre club "à domicile".
    const rencontre: ResultatRencontre = {
      domicile: partie.clubId,
      exterieur: setup.adversaire.id,
      butsDomicile: resultat.butsPour,
      butsExterieur: resultat.butsContre,
    }

    // A-t-on gagné ? En CHAMPIONNAT, un nul reste un nul (pas de vainqueur).
    // En FINALE de coupe, il faut un vainqueur : si c'est nul, on le décide aux
    // tirs au but (tirage au sort seedé, 50/50).
    let gagne = resultat.butsPour > resultat.butsContre
    let tirsAuBut = false
    const nul = resultat.butsPour === resultat.butsContre
    if (finale !== undefined && nul) {
      tirsAuBut = true
      gagne = rng() < 0.5 // séance de tirs au but
    }

    setResolution({ resultat, recit, nouvellesJauges, rencontre, gagne, tirsAuBut })
  }

  // ---- Affichage APRÈS le match (si on a une résolution) ----
  if (resolution !== undefined) {
    const { resultat, recit } = resolution

    // On numérote les deux XI 1..11 (ordre : 1 gardien, 4 déf, 4 mil, 2 att).
    const nous = setup.nosTitulaires.map((joueur, index) => ({ joueur, numero: index + 1 }))
    const adv = setup.titulairesAdverses.map((joueur, index) => ({ joueur, numero: index + 1 }))

    // Dessine une rangée de joueurs d'un poste donné, à partir d'une liste numérotée.
    // On colore chaque équipe avec SES couleurs de club. adverse = true → pas de
    // badge (on n'a pas les stats individuelles de l'adversaire).
    /*
      en gros on va filtrer la liste des joueurs pour ne garder que ceux du poste demandé, 
      puis on va les mapper pour créer un composant JoueurSurTerrain pour chacun d'eux,
      en passant les props nécessaires (numéro, joueur, buts, passes, couleur, bordure).
      le key est important pour react pour savoir quel élément a changé dans la liste.
      on va faire ça pour chaque poste (G, D, M, A) pour les deux équipes (nous et adversaire).
      le ? dans ouZero(resultat.buteurs[n.joueur.id]) signifie que si le joueur n'a pas marqué de but, on renvoie 0 au lieu de undefined.
      la fonction prend en paramètre une liste de joueurs numérotés, un poste et un booléen adverse pour savoir si c'est l'équipe adverse ou pas.
    */
    function rangee(liste: { joueur: Player; numero: number }[], poste: Poste, adverse: boolean) {
      const couleurs = adverse ? setup.adversaire.couleurs : monClub.couleurs // on prend les couleurs du club adverse si c'est l'adversaire, sinon celles de notre club
      return (
        <div className="terrain__ligne">
          {liste
            .filter((n) => n.joueur.poste === poste)
            .map((n) => (
              <JoueurSurTerrain
                key={(adverse ? 'a-' : 'n-') + n.joueur.id} // (adverse ? 'a-' : 'n-') = si c'est l'adversaire on met a- sinon n- pour différencier les clés des joueurs adverses et les nôtres
                numero={n.numero}
                joueur={n.joueur}
                buts={adverse ? 0 : ouZero(resultat.buteurs[n.joueur.id])}
                passes={adverse ? 0 : ouZero(resultat.passeurs[n.joueur.id])}
                couleur={couleurs.principale}
                bordure={couleurs.secondaire}
              />
            ))}
        </div>
      )
    }

    return (
      <div className={classeRacine}>
        {/* Bannière de compétition (seulement pour une finale de coupe). */}
        {finale !== undefined && <p className="match__competition">{finale.titre}</p>}
        <p className="match__fin">Fin du match</p>
        <h1 className="match__score">
          {resultat.butsPour} – {resultat.butsContre}
        </h1>
        <p className="match__affiche">
          {monClub.nom} vs {setup.adversaire.nom}
        </p>

        {/* Si la finale s'est jouée aux tirs au but, on l'indique (et qui a gagné). */}
        {resolution.tirsAuBut && (
          <p className="match__tab">
            Tirs au but — {resolution.gagne ? 'Victoire !' : 'Défaite'}
          </p>
        )}

        {/* La pelouse HORIZONTALE : NOTRE équipe à gauche (gardien à l'extrême
            gauche → attaque vers le centre), une ligne médiane verticale, puis
            l'adversaire à droite (attaque vers le centre → gardien à l'extrême
            droite), comme un écran de match classique. */}
        <div className="terrain">
          {rangee(nous, 'G', false)}
          {rangee(nous, 'D', false)}
          {rangee(nous, 'M', false)}
          {rangee(nous, 'A', false)}
          <div className="terrain__centre"></div>
          {rangee(adv, 'A', true)}
          {rangee(adv, 'M', true)}
          {rangee(adv, 'D', true)}
          {rangee(adv, 'G', true)}
        </div>

        <p className="match__recit">{recit}</p>

        {/* Tableau des notes, avec colonnes buts et passes pour "expliquer" la note. */}
        <h2 className="match__sous-titre">Notes des joueurs</h2>
        <table className="tableau-notes">
          <thead>
            <tr>
              <th className="tableau-notes__nom">Joueur</th>
              <th>Buts</th>
              <th>Passes</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {setup.nosTitulaires.map((joueur) => (
              <tr key={joueur.id}>
                <td className="tableau-notes__nom">
                  {joueur.prenom} {joueur.nom}
                </td>
                <td>{ouZero(resultat.buteurs[joueur.id])}</td>
                <td>{ouZero(resultat.passeurs[joueur.id])}</td>
                <td className="tableau-notes__note">{resultat.notes[joueur.id]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          className="match__continuer"
          onClick={() =>
            onContinuer(resolution.nouvellesJauges, resolution.rencontre, resolution.gagne)
          }
        >
          Continuer
        </button>
      </div>
    )
  }

  // ---- Affichage AVANT le match : pronostic + choix ----
  return (
    <div className={classeRacine}>
      {/* Bannière de compétition (seulement pour une finale de coupe). */}
      {finale !== undefined && <p className="match__competition">{finale.titre}</p>}
      <p className="match__affiche">
        {monClub.nom} <span className="match__vs">vs</span> {setup.adversaire.nom}
      </p>

      {/* Pronostic : une barre en 3 segments (victoire / nul / défaite). La largeur
          de chaque segment = sa probabilité en %. */}
      <div className="prono">
        <div className="prono__barre">
          <div className="prono__seg prono__seg--v" style={{ width: pourcent(setup.pronostic.victoire) }}></div>
          <div className="prono__seg prono__seg--n" style={{ width: pourcent(setup.pronostic.nul) }}></div>
          <div className="prono__seg prono__seg--d" style={{ width: pourcent(setup.pronostic.defaite) }}></div>
        </div>
        <div className="prono__legende">
          <span>Victoire {pourcent(setup.pronostic.victoire)}</span>
          <span>Nul {pourcent(setup.pronostic.nul)}</span>
          <span>Défaite {pourcent(setup.pronostic.defaite)}</span>
        </div>
      </div>

      {/* Le choix : s'il y en a un, on affiche son texte + un bouton par option.
          Sinon, un simple bouton de coup d'envoi (on joue sans option). */}
      {setup.choix !== undefined ? (
        <div className="choix">
          <h2 className="choix__texte">{setup.choix.texte}</h2>
          <div className="choix__options">
          {/* chaque option est un bouton qui a un index comme key */}
            {setup.choix.options.map((option, index) => (
              // index comme key : ici les options d'un même choix sont fixes et ordonnées.
              <button type="button" className="choix__option" key={index} onClick={() => jouer(option)}>
                {option.texte}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className="match__continuer" onClick={() => jouer(undefined)}>
          Coup d'envoi
        </button>
      )}
    </div>
  )
}
