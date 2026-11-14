import { CLUBS } from '../data/clubs'
import { etoiles } from './format' // fonction partagée (sortie dans format.ts)
import './ChoixClub.css'

// Ordre d'affichage des championnats (sections de la page).
const CHAMPIONNATS = ['France', 'Angleterre', 'Espagne', 'Italie', 'Allemagne']

// En React, un COMPOSANT est une fonction qui renvoie du JSX (du HTML écrit dans
// le JS). Les "props" sont ses paramètres d'entrée : ici une seule, onChoisir,
// une fonction que le composant appellera quand on clique un club (en lui passant
// l'id du club). C'est le composant parent (App) qui décidera quoi en faire.
interface ChoixClubProps {
  onChoisir: (clubId: string) => void // pr simplifier onchoisir est une fonction qui prend un string (l'id du club) et ne renvoie rien (void)
}

export function ChoixClub({ onChoisir }: ChoixClubProps) {
  return (
    <div className="choix-club">
      <h1 className="choix-club__titre">Choisis ton club</h1>
      <p className="choix-club__intro">Plus il y a d'étoiles, plus le club est fort.</p>

      {/* En JSX, les accolades { } permettent d'insérer du JS dans le HTML.
          .map() transforme un tableau (les championnats) en une liste de balises :
          pour chaque championnat, on renvoie une <section>. 
          en gros des qu'on as le championnat, on recupere tout les clubs de ce championnat et on les affiche dans une section.
          */}
      {CHAMPIONNATS.map((championnat) => {
        // On ne garde que les clubs de ce championnat.
        const clubsDuChampionnat = CLUBS.filter((club) => club.championnat === championnat)

        return (
          // "key" : un identifiant unique par élément d'une liste. React en a besoin
          // pour suivre efficacement chaque bloc. Ici le nom du championnat suffit.
          <section className="championnat" key={championnat}>
            <h2 className="championnat__nom">{championnat}</h2> {/* Commentaire : le nom du championnat est affiché en titre de section */}

            <div className="championnat__grille">
              {clubsDuChampionnat.map((club) => (
                // Une carte cliquable par club (un <button> pour l'accessibilité).
                // onClick reçoit une petite fonction fléchée qui appelle onChoisir
                // avec l'id de CE club.
                <button
                  type="button" //  donc chaque club est un bouton ou si on clique dessus, on appelle la fonction onChoisir avec l'id du club
                  className="carte-club"
                  key={club.id}
                  onClick={() => onChoisir(club.id)}
                >
                  {/* La pastille aux couleurs du club. Ces couleurs viennent des
                      DONNÉES (différentes pour chaque club), donc on les applique en
                      "style inline". Double accolade : la 1re = "j'insère du JS", la
                      2e = l'objet JS décrivant le style { propriété: valeur }. */}
                  <span
                    className="carte-club__pastille"
                    style={{
                      background: club.couleurs.principale,
                      borderColor: club.couleurs.secondaire,
                    }}
                  ></span>

                  <span className="carte-club__nom">{club.nom}</span>
                  <span className="carte-club__etoiles">{etoiles(club.prestige)}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
