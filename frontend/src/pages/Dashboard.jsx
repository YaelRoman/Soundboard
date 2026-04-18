import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import BoardCard from "../components/BoardCard";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [boards,     setBoards]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [name,       setName]       = useState("");
  const [desc,       setDesc]       = useState("");
  const [isPublic,   setIsPublic]   = useState(true);
  const [tags,       setTags]       = useState("");
  const [formErr,    setFormErr]    = useState(null);
  const [loadErr,    setLoadErr]    = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setLoadErr(null);
    api.getMyBoards({ size: 100 })
      .then(d => setBoards(d?.items ?? []))
      .catch(err => setLoadErr(err.message ?? "Failed to load boards"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async e => {
    e.preventDefault();
    setFormErr(null);
    setCreating(true);
    try {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      const board   = await api.createBoard({ name, description: desc || undefined, is_public: isPublic, tags: tagList });
      setBoards(prev => [board, ...prev]);
      setShowForm(false);
      setName(""); setDesc(""); setTags(""); setIsPublic(true);
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async boardId => {
    if (!confirm("Delete this board and all its sounds?")) return;
    try {
      await api.deleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={"font-display " + styles.title}>My Boards</h1>
          <p className={styles.sub}>{boards.length} boards</p>
        </div>
        <button className={styles.newBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancel" : "+ New Board"}
        </button>
      </div>

      {/* Load error */}
      {loadErr && (
        <div className={styles.error} style={{ marginBottom: "1rem" }}>
          {loadErr}
          <button style={{ marginLeft: "1rem", cursor: "pointer" }}
            onClick={() => { setLoadErr(null); setLoading(true);
              api.getMyBoards({ size: 100 })
                .then(d => setBoards(d?.items ?? []))
                .catch(err => setLoadErr(err.message ?? "Failed to load boards"))
                .finally(() => setLoading(false)); }}>
            Retry
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form className={"glass " + styles.form} onSubmit={handleCreate}>
          <h3 className={styles.formTitle}>New Board</h3>
          {formErr && <div className={styles.error}>{formErr}</div>}

          <label className={styles.label}>
            Name *
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </label>
          <label className={styles.label}>
            Description
            <textarea className={styles.input + " " + styles.textarea} value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
          </label>
          <label className={styles.label}>
            Tags <span className={styles.hint}>(comma-separated)</span>
            <input className={styles.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="trap, 808, drums" />
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <span>Public board</span>
          </label>
          <button className={styles.submitBtn} type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create Board"}
          </button>
        </form>
      )}

      {/* Board grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : boards.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◉</span>
          <p>No boards yet. Create one!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map(b => (
            <BoardCard key={b.id} board={b} canDelete onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
