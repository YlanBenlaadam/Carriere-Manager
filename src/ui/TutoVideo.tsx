import { useEffect } from 'react'
import './TutoVideo.css'

// Overlay plein écran qui lit la vidéo tuto. Props : onFermer (ferme l'overlay).
// La vidéo est servie depuis public/tuto.mp4 → on y accède via l'URL "/tuto.mp4".
// window = l'objet global du navigateur, qui représente la fenêtre. 
// On peut y brancher un écouteur d'événement pour fermer l'overlay si l'utilisateur appuie sur la touche Échap.
export function TutoVideo({ onFermer }: { onFermer: () => void }) {
  // Fermeture au clavier avec la touche Échap (confort). On branche l'écouteur au
  // montage et on le retire au démontage (sinon il s'empilerait à chaque ouverture).
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      // on place un ecouteur sur le clavier pour fermer l'overlay si l'utilisateur appuie sur la touche "Escape"
      if (evenement.key === 'Escape') {
        onFermer()
      }
    }
    // on branche l'écouteur sur l'objet global window (la fenêtre du navigateur)
    //keydown = appui sur une touche du clavier sa appelle la fonction surTouche
    // et la fonction surTouche va vérifier si la touche appuyée est "Escape" 
    // et si c'est le cas elle va appeler la fonction onFermer pour fermer l'overlay
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  return (
    // Le fond semi-opaque : un clic dessus ferme l'overlay.
    <div className="tuto" onClick={onFermer}>
      {/* stopPropagation : un clic SUR le cadre vidéo ne doit pas remonter jusqu'au
          fond (sinon cliquer "lecture" fermerait aussitôt l'overlay). */}
      <div className="tuto__cadre" onClick={(evenement) => evenement.stopPropagation()}>
        <button type="button" className="tuto__fermer" onClick={onFermer} aria-label="Fermer">
          ✕
        </button>
        {/* controls = barre de lecture ; autoPlay = démarre tout seul (le clic sur
            "Regarder le tuto" fait office de geste utilisateur) ; playsInline = sur
            mobile, lit dans la page au lieu de passer en plein écran forcé. */}
        <video className="tuto__video" src="/tuto.mp4" controls autoPlay playsInline>
          Ton navigateur ne peut pas lire cette vidéo.
        </video>
      </div>
    </div>
  )
}
