import { motion } from 'framer-motion';
import { MockRankingService } from '../lib/ranking';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allScores: Record<string, number>;
  userName: string | null;
}

export function RankingModal({ isOpen, onClose, allScores, userName }: RankingModalProps) {
  if (!isOpen) return null;

  const globalRanking = MockRankingService.getGlobalRanking(allScores, userName);

  return (
    <motion.div
      className="hint-modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="hint-modal-content ranking-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <button className="hint-modal-close" onClick={onClose}>&times;</button>
        <h2 className="ranking-modal-title">🏆 Global Ranking 🏆</h2>
        <p className="ranking-modal-subtitle">Today score across all daily modes</p>

        <div className="ranking-modal-list">
          {globalRanking.map((entry, index) => {
            const isRealRank = index < 10;
            const rankDisplay = isRealRank ? index + 1 : '...';

            return (
              <div key={index} className={`ranking-modal-item ${entry.isUser ? 'is-user' : ''}`}>
                <div className="rank-num">{rankDisplay}</div>
                <div className="rank-name">{entry.name}</div>
                <div className="rank-score">{entry.score} pts</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
