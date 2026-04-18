import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import BoardCard from "../components/BoardCard";
import styles from "./UserProfile.module.css";

export default function UserProfile() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const [profile,    setProfile]  = useState(null);
  const [boards,     setBoards]   = useState([]);
  const [loading,    setLoading]  = useState(true);
  const [error,      setError]    = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getUser(username), api.getUserBoards(username)])
      .then(([p, b]) => { setProfile(p); setBoards(b); })
      .catch(e => setError(e.status === 404 ? "User not found" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className={styles.center}><span className={styles.spinner} /></div>;
  if (error)   return (
    <div className={styles.center}>
      <p className={styles.errorMsg}>{error}</p>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div className={"glass " + styles.profileCard}>
        <div className={styles.avatar}>
          {profile.username[0].toUpperCase()}
        </div>
        <div className={styles.info}>
          <h1 className={"font-display " + styles.username}>@{profile.username}</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={"font-orbitron " + styles.statVal}>{profile.boards_count}</span>
              <span className={styles.statLabel}>boards</span>
            </div>
            <div className={styles.stat}>
              <span className={"font-orbitron " + styles.statVal}>{profile.sounds_count}</span>
              <span className={styles.statLabel}>sounds</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Public Boards</h2>

      {boards.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>◎</span>
          <p>No public boards yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map(b => <BoardCard key={b.id} board={b} />)}
        </div>
      )}
    </div>
  );
}
