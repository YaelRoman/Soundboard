import { useState, useRef, useCallback } from "react";
import WaveformVisualiser from "./WaveformVisualiser";
import TagChip from "./TagChip";
import { api } from "../api/client";
import styles from "./SoundButton.module.css";

export default function SoundButton({ sound, canEdit, onDeleted, onUpdated }) {
  const [playing,   setPlaying]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState(sound.name);
  const [analyser,  setAnalyser]  = useState(null);
  const [error,     setError]     = useState(null);

  const audioRef  = useRef(null);
  const ctxRef    = useRef(null);
  const srcRef    = useRef(null);

  const play = useCallback(async () => {
    if (playing) {
      audioRef.current?.pause();
      audioRef.current && (audioRef.current.currentTime = 0);
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = ctxRef.current;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const audio = new Audio(api.streamUrl(sound.id));
      audio.crossOrigin = "anonymous";
      audioRef.current  = audio;

      if (!srcRef.current) {
        const src  = audioCtx.createMediaElementSource(audio);
        const anal = audioCtx.createAnalyser();
        anal.fftSize = 64;
        src.connect(anal);
        anal.connect(audioCtx.destination);
        srcRef.current = src;
        setAnalyser(anal);
      }

      audio.onended = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch (e) {
      setError("Playback failed");
    } finally {
      setLoading(false);
    }
  }, [playing, sound.id]);

  const handleSave = async () => {
    try {
      const updated = await api.updateSound(sound.id, { name: editName });
      onUpdated?.(updated);
      setEditing(false);
    } catch { setError("Save failed"); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${sound.name}"?`)) return;
    try {
      await api.deleteSound(sound.id);
      onDeleted?.(sound.id);
    } catch { setError("Delete failed"); }
  };

  return (
    <div className={styles.card + (playing ? " " + styles.playing : "")}>
      {/* Waveform */}
      <div className={styles.waveform} onClick={play}>
        <WaveformVisualiser analyser={analyser} isPlaying={playing} static={!playing} />
        <div className={styles.playOverlay}>
          {loading ? <span className={styles.spinner} /> : playing ? "■" : "▶"}
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        {editing ? (
          <input
            className={styles.nameInput}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            autoFocus
          />
        ) : (
          <span className={styles.name} onClick={play}>{sound.name}</span>
        )}
        <div className={styles.meta}>
          <span className={"font-orbitron " + styles.duration}>
            {sound.duration_ms ? `${(sound.duration_ms / 1000).toFixed(1)}s` : "—"}
          </span>
          <div className={styles.tags}>
            {(sound.tags || []).slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className={styles.actions}>
          {editing ? (
            <>
              <button className={styles.actionBtn} onClick={handleSave} title="Save">✓</button>
              <button className={styles.actionBtn} onClick={() => setEditing(false)} title="Cancel">✕</button>
            </>
          ) : (
            <>
              <button className={styles.actionBtn} onClick={() => setEditing(true)} title="Edit">✏</button>
              <button className={styles.actionBtn + " " + styles.danger} onClick={handleDelete} title="Delete">🗑</button>
            </>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
