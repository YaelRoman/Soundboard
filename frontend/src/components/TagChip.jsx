import styles from "./TagChip.module.css";

export default function TagChip({ tag, active, onClick, removable, onRemove }) {
  return (
    <span
      className={styles.chip + (active ? " " + styles.active : "") + (onClick ? " " + styles.clickable : "")}
      onClick={onClick}
    >
      {tag}
      {removable && (
        <button className={styles.remove} onClick={e => { e.stopPropagation(); onRemove(tag); }}>
          ×
        </button>
      )}
    </span>
  );
}
