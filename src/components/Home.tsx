import type { ReactNode } from 'react';

type ModeButtonProps = {
  id: string;
  name: string;
  subtitle: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

function ModeButton({ name, subtitle, icon, active, onClick }: ModeButtonProps) {
  return (
    <button 
      type="button" 
      className={`mode-btn ${active ? 'is-active' : 'is-locked'}`} 
      onClick={onClick} 
      disabled={!active}
    >
      <div className="mode-icon-wrap">
        <div className="mode-icon">{icon}</div>
      </div>
      <div className="mode-content">
        <span className="mode-name">{name}</span>
        <span className="mode-subtitle">{active ? subtitle : 'coming...'}</span>
      </div>
    </button>
  );
}

type HomeProps = {
  onSelectMode: (mode: 'classic') => void;
};

export function Home({ onSelectMode }: HomeProps) {
  return (
    <main className="home-stage">
      <header className="home-header">
        <img src="/logo.png" alt="Disnedle - Guess the daily Disney character" className="home-logo" />
        <h1 className="home-subtitle">Guess the daily Disney character</h1>
      </header>
      
      <section className="home-modes">
        <ModeButton 
          id="classic" 
          name="Classic" 
          subtitle="Get clues with every try" 
          icon="✨" 
          active={true} 
          onClick={() => onSelectMode('classic')} 
        />
        <ModeButton 
          id="emoji" 
          name="Emoji" 
          subtitle="Guess with a set of emojis" 
          icon="😃" 
          active={false} 
        />
        <ModeButton 
          id="silhouette" 
          name="Silhouette" 
          subtitle="Whose silhouette is this?" 
          icon="👤" 
          active={false} 
        />
        <ModeButton 
          id="card" 
          name="Card" 
          subtitle="Wait and see!" 
          icon={<img src="/lorcana.png" alt="Lorcana" style={{ width: '65%', height: '65%', objectFit: 'contain', backgroundColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />} 
          active={false} 
        />
        <ModeButton 
          id="song" 
          name="Song" 
          subtitle="Guess the song!" 
          icon="🎵" 
          active={false} 
        />
      </section>
    </main>
  );
}
