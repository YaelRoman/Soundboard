import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/me");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={"glass " + styles.form} onSubmit={submit}>
        <h1 className={"font-display " + styles.title}>Login</h1>
        <p className={styles.sub}>Welcome back, creator.</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus />
        </label>

        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)} required />
        </label>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Login →"}
        </button>

        <p className={styles.switch}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
