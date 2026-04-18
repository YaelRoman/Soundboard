import { useNavigate } from "react-router-dom";
import TagChip from "./TagChip";
import styles from "./BoardCard.module.css";

export default function BoardCard({ board, onDelete, canDelete }) {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/boards/${board.id}`)}>
      <div className={styles.header}>
        <h3 className={"font-display " + styles.name}>{board.name}</h3>
        {canDelete && (
          <button
            className={styles.deleteBtn}
            onClick={e => { e.stopPropagation(); onDelete(board.id); }}
            title="Delete board"
          >
            🗑
          </button>
        )}
      </div>

      {board.description && (
        <p className={styles.desc}>{board.description}</p>
      )}

      <div className={styles.footer}>
        <span className={styles.meta}>
          <span className={styles.metaItem}>@ {board.owner?.username}</span>
          <span className={styles.metaItem}>
            <span className={"font-orbitron " + styles.count}>{board.sound_count ?? 0}</span> sounds
          </span>
        </span>
        <div className={styles.tags}>
          {(board.tags || []).slice(0, 4).map(t => <TagChip key={t} tag={t} />)}
        </div>
      </div>
    </div>
  );
}
