import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV = [
  { to: "/",          icon: "◈", label: "Explore"   },
  { to: "/me",        icon: "⬡", label: "My Boards", auth: true },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <aside
      className={styles.sidebar + (expanded ? " " + styles.expanded : "")}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◉</span>
        {expanded && <span className={styles.logoText + " font-display"}>SoundBoard</span>}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.filter(n => !n.auth || user).map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) =>
              styles.navItem + (isActive ? " " + styles.active : "")
            }
          >
            <span className={styles.navIcon}>{n.icon}</span>
            {expanded && <span className={styles.navLabel}>{n.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: auth */}
      <div className={styles.bottom}>
        {user ? (
          <>
            <NavLink to="/me" className={styles.navItem}>
              <span className={styles.avatar}>
                {user.username[0].toUpperCase()}
              </span>
              {expanded && <span className={styles.navLabel}>{user.username}</span>}
            </NavLink>
            <button className={styles.navItem} onClick={handleLogout} title="Logout">
              <span className={styles.navIcon}>⇥</span>
              {expanded && <span className={styles.navLabel}>Logout</span>}
            </button>
          </>
        ) : (
          <NavLink to="/login" className={styles.navItem}>
            <span className={styles.navIcon}>→</span>
            {expanded && <span className={styles.navLabel}>Login</span>}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
