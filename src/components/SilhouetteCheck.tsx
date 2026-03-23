import type { DisneyCharacter } from '../types';

interface SilhouetteCheckProps {
  characters: DisneyCharacter[];
  onBack: () => void;
}

export function SilhouetteCheck({ characters, onBack }: SilhouetteCheckProps) {
  return (
    <div className="silhouette-check">
      <header className="silhouette-header">
        <h2 className="check-title">Silhouette Verification ({characters.length})</h2>
        <button className="new-game-button" onClick={onBack}>&larr; Back to Home</button>
      </header>

      <div className="check-grid">
        {characters.map(c => (
          <div key={c.id} className={`check-item ${!c.silhouettePath ? 'is-missing' : ''}`}>
            <div className="check-card">
              <div className="check-img-wrap">
                <span className="check-label">{c.silhouettePath ? 'Silhouette' : 'Missing'}</span>
                {c.silhouettePath ? (
                  <img 
                    src={`/silhouette/${c.silhouettePath}`} 
                    alt={`${c.name} silhouette`} 
                    className="check-silhouette-img" 
                  />
                ) : (
                  <div className="check-silhouette-img check-missing-placeholder">
                    <span>?</span>
                  </div>
                )}
              </div>
              <div className="check-img-wrap">
                <span className="check-label">Original</span>
                <img 
                  src={`/characters/${c.imageFile}`} 
                  alt={`${c.name} original`} 
                  className="check-original-img" 
                />
              </div>
            </div>
            <div className="check-info">
              <span className="check-character-name">{c.name}</span>
              <span className="check-character-movie">{c.movie} ({c.year})</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="check-footer">
        <button className="new-game-button" onClick={onBack}>&larr; Back to Home</button>
      </footer>
    </div>
  );
}
