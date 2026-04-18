import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SoundButton from "../components/SoundButton";
import TagChip from "../components/TagChip";
import styles from "./BoardView.module.css";

export default function BoardView() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [board,     setBoard]     = useState(null);
  const [sounds,    setSounds]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);

  const isOwner = user && board && user.id === board.owner?.id;

  useEffect(() => {
    setLoading(true);
    api.getBoard(id)
      .then(b => { setBoard(b); setSounds(b.sounds || []); })
      .catch(e => setError(e.status === 404 ? "Board not found" : e.status === 403 ? "This board is private" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file",     file);
      form.append("board_id", id);
      form.append("name",     file.name.replace(/\.[^.]+$/, ""));
      const sound = await api.uploadSound(form);
      setSounds(prev => [...prev, sound]);
    } catch (e) {
      setUploadErr(e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSoundDeleted = id => setSounds(prev => prev.filter(s => s.id !== id));
  const handleSoundUpdated = upd => setSounds(prev => prev.map(s => s.id === upd.id ? { ...s, ...upd } : s));

  if (loading) return <div className={styles.center}><span className={styles.spinner} /></div>;
  if (error)   return (
    <div className={styles.center}>
      <p className={styles.errorMsg}>{error}</p>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Board header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <div className={styles.meta}>
          <h1 className={"font-display " + styles.title}>{board.name}</h1>
          {board.description && <p className={styles.desc}>{board.description}</p>}
          <div className={styles.row}>
            <span className={styles.owner}>@ {board.owner?.username}</span>
            <span className={styles.count + " font-orbitron"}>{sounds.length} sounds</span>
            {!board.is_public && <span className={styles.privateBadge}>Private</span>}
          </div>
          {board.tags?.length > 0 && (
            <div className={styles.tags}>
              {board.tags.map(t => <TagChip key={t} tag={t} />)}
            </div>
          )}
        </div>

        {isOwner && (
          <label className={styles.uploadBtn + (uploading ? " " + styles.uploading : "")}>
            {uploading ? "Uploading…" : "+ Upload Sound"}
            <input type="file" accept="audio/*" onChange={handleUpload} hidden disabled={uploading} />
          </label>
        )}
      </div>
      {uploadErr && <div className={styles.uploadErr}>{uploadErr}</div>}

      {/* Sound grid */}
      {sounds.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◎</span>
          <p>{isOwner ? "Upload your first sound to get started." : "No sounds yet."}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sounds.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 40}ms` }}>
              <SoundButton
                sound={s}
                canEdit={!!isOwner}
                onDeleted={handleSoundDeleted}
                onUpdated={handleSoundUpdated}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
