import React from 'react';
import type { DisneyCharacter } from '../types';

type CheckCharactersProps = {
  characters: DisneyCharacter[];
  onBack: () => void;
};

export function CheckCharacters({ characters, onBack }: CheckCharactersProps) {
  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />
      <main className="game-stage" style={{ maxWidth: '800px' }}>
        <header className="game-topbar">
          <button className="new-game-button" type="button" onClick={onBack}>
            Back
          </button>
          <div className="game-title-wrap">
            <span className="game-mode">Character Image Check</span>
          </div>
          <div className="game-hint-wrap">
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
              Total: {characters.length}
            </span>
          </div>
        </header>

        <section className="game-panel" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {characters.map((c) => (
            <div key={c.id} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden', marginBottom: '1rem', border: '2px solid rgba(255,255,255,0.2)' }}>
                <img 
                  src={`/characters/${c.imageFile}`} 
                  alt={c.name} 
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.classList.contains('is-fallback')) {
                      target.src = '';
                      target.classList.add('is-fallback');
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.5rem;color:rgba(255,255,255,0.5)">?</span>`;
                      }
                    }
                  }}
                />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#fff' }}>{c.name}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{c.movie}</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.65rem', color: '#8b5cf6', wordBreak: 'break-all' }}>{c.imageFile}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
