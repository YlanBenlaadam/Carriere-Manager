import { useState } from 'react'
import { CLUBS } from '../data/clubs'
import { compterTrophees } from '../game/palmares'
import { construireSvgFiche, svgVersPngBlob, telechargerBlob, partagerFiche } from './ficheBilan'
import type { DonneesFiche } from './ficheBilan'
import type { GameState } from '../game/types'
import './EcranFinCarriere.css'

// Écran de fin de carrière : bilan global + résumé partageable.
// Props : la partie (état final), la raison de la fin, et onRejouer (recommencer).
export function EcranFinCarriere({
  partie,
  raison,
  onRejouer,
}: {
  partie: GameState
  raison: 'licencie' | 'fin_carriere' | null
  onRejouer: () => void
}) {
  // Petit état local pour afficher "Copié !" après un clic sur le bouton copier.
  // en gorss, on ne fait que changer le texte du bouton après un clic, puis on le remet à "Copier" au prochain rendu.
  const [copie, setCopie] = useState(false)
  // État des actions sur la fiche image : '' (rien), 'travail' (génération en cours),
  // puis le résultat ('telecharge', 'partage', ou 'copie' en repli presse-papier).
  const [etatImage, setEtatImage] = useState<'' | 'travail' | 'telecharge' | 'partage' | 'copie'>('')

  function nomDe(id: string): string {
    return CLUBS.find((c) => c.id === id)!.nom
  }

  // --- Statistiques de carrière, calculées depuis l'historique des saisons. ---
  const nbSaisons = partie.historique.length

  // Note moyenne de carrière : somme des notes / nombre de saisons (0 si aucune).
  let noteMoyenne = 0
  if (nbSaisons > 0) {
    let somme = 0
    for (const saison of partie.historique) {
      somme += saison.note
    }
    noteMoyenne = Math.round((somme / nbSaisons) * 10) / 10
  }

  const nbTrophees = partie.palmares.length
  const titres = compterTrophees(partie.palmares, 'championnat') + compterTrophees(partie.palmares, 'ldc') + compterTrophees(partie.palmares, 'europa')+ compterTrophees(partie.palmares, 'coupe_nationale')
  const nomClubActuel = nomDe(partie.clubId)

  // Titre selon la raison de fin.
  let titre = 'Fin de carrière'
  if (raison === 'licencie') {
    titre = 'Licencié — fin de carrière'
  }

  // --- Résumé partageable (texte + emojis). ---
  const resumePartage =
    `🎮 Ma carrière — Carrière Manager\n` +
    `📅 ${nbSaisons} saison(s) · 📈 Note moyenne ${noteMoyenne}/10\n` +
    `🏆 ${nbTrophees} trophée(s) · ⭐ Réputation ${partie.reputation}/100\n` +
    `🏟️ Dernier club : ${nomClubActuel}`

  // Copie le résumé dans le presse-papier (API du navigateur), puis affiche "Copié !".
  function copier() {
    navigator.clipboard.writeText(resumePartage)
    setCopie(true)
  }

  // Couleur d'une note (mêmes seuils que le bilan : vert / jaune / rouge).
  function couleurNote(note: number): string {
    if (note >= 7) {
      return 'var(--accent)'
    }
    if (note >= 5) {
      return 'var(--or)'
    }
    return 'var(--danger)'
  }

  // --- Données pour la FICHE IMAGE téléchargeable/partageable. ---
  // Le club actuel (pour les couleurs de la pastille dessinée sur la carte).
  const clubActuel = CLUBS.find((c) => c.id === partie.clubId)!

  // Lignes de palmarès : on compte chaque type de trophée et on ne garde que
  // celles qui ont au moins 1 (pas de ligne "×0").
  const lignesPalmares = [
    { label: 'Championnat', nombre: compterTrophees(partie.palmares, 'championnat') },
    { label: 'Coupe nationale', nombre: compterTrophees(partie.palmares, 'coupe_nationale') },
    { label: 'Ligue des Champions', nombre: compterTrophees(partie.palmares, 'ldc') },
    { label: 'Europa League', nombre: compterTrophees(partie.palmares, 'europa') },
  ].filter((ligne) => ligne.nombre > 0)

  const donneesFiche: DonneesFiche = {
    titreClub: nomClubActuel,
    couleurClub: clubActuel.couleurs.principale,
    couleurClubBordure: clubActuel.couleurs.secondaire,
    nbSaisons,
    noteMoyenne,
    nbTrophees,
    reputation: partie.reputation,
    palmares: lignesPalmares,
  }

  // Télécharge la fiche en PNG (génère le SVG → PNG → déclenche le téléchargement).
  async function telechargerFiche() {
    setEtatImage('travail')
    try {
      const blob = await svgVersPngBlob(construireSvgFiche(donneesFiche))
      telechargerBlob(blob, 'carriere-manager.png')
      setEtatImage('telecharge')
    } catch {
      setEtatImage('')
    }
  }

  // Partage la fiche via le menu natif (repli = copie du texte).
  async function partager() {
    setEtatImage('travail')
    try {
      const blob = await svgVersPngBlob(construireSvgFiche(donneesFiche))
      const resultat = await partagerFiche(blob, 'carriere-manager.png', resumePartage)
      if (resultat === 'partage') {
        setEtatImage('partage')
      } else if (resultat === 'copie') {
        setEtatImage('copie')
      } else {
        setEtatImage('')
      }
    } catch {
      setEtatImage('')
    }
  }

  return (
    <div className="fin">
      <h1 className="fin__titre">{titre}</h1>

      {/* Les grandes stats de la carrière, en "tuiles". */}
      <div className="fin__stats">
        <div className="fin__stat">
          <span className="fin__stat-valeur">{nbSaisons}</span>
          <span className="fin__stat-label">saisons</span>
        </div>
        <div className="fin__stat">
          <span className="fin__stat-valeur" style={{ color: couleurNote(noteMoyenne) }}>
            {noteMoyenne}
          </span>
          <span className="fin__stat-label">note moyenne</span>
        </div>
        <div className="fin__stat">
          <span className="fin__stat-valeur">{titres}</span>
          <span className="fin__stat-label">titre(s)</span>
        </div>
        <div className="fin__stat">
          <span className="fin__stat-valeur">{partie.reputation}</span>
          <span className="fin__stat-label">réputation</span>
        </div>
      </div>

      {/* Le parcours saison par saison. */}
      <h2 className="fin__sous-titre">Parcours</h2>
      <table className="fin__parcours">
        <thead>
          <tr>
            <th>Saison</th>
            <th className="fin__col-club">Club</th>
            <th>Classé</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {partie.historique.map((s) => (
            <tr key={s.saison}>
              <td>{s.saison}</td>
              <td className="fin__col-club">{nomDe(s.clubId)}</td>
              <td>{s.rangReel}ᵉ</td>
              <td style={{ color: couleurNote(s.note), fontWeight: 700 }}>{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Partager ma carrière : partage natif + fiche image téléchargeable. */}
      <h2 className="fin__sous-titre">Partager ma carrière</h2>
      <pre className="fin__partage">{resumePartage}</pre>
      <div className="fin__actions">
        <button
          type="button"
          className="fin__rejouer"
          onClick={partager}
          disabled={etatImage === 'travail'}
        >
          📤 Partager
        </button>
        <button
          type="button"
          className="fin__copier"
          onClick={telechargerFiche}
          disabled={etatImage === 'travail'}
        >
          ⬇️ Télécharger la fiche
        </button>
        <button type="button" className="fin__copier" onClick={copier}>
          {copie ? 'Copié ✅' : 'Copier le texte'}
        </button>
        <button type="button" className="fin__copier" onClick={onRejouer}>
          Rejouer
        </button>
      </div>

      {/* Retour visuel selon l'action image (génération / résultat). */}
      {etatImage === 'travail' && <p className="fin__statut">Génération de la fiche…</p>}
      {etatImage === 'telecharge' && <p className="fin__statut">Fiche téléchargée ✅</p>}
      {etatImage === 'partage' && <p className="fin__statut">Partagé ✅</p>}
      {etatImage === 'copie' && (
        <p className="fin__statut">Partage d'image indisponible ici — résumé copié ✅</p>
      )}
    </div>
  )
}
