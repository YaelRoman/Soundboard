import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

// Validation rules
const RULES = {
  username: { min: 3, max: 30, pattern: /^[a-zA-Z0-9_]*$/, msg: "Letters, numbers, underscores only" },
  password: { min: 8 },
  email: { pattern: /@/, msg: "Valid email required" },
};

// Real-time validation helpers
function validateUsername(val) {
  if (!val) return { valid: null, hint: "" };
  if (val.length < RULES.username.min) return { valid: false, hint: `✗ Must be ${RULES.username.min}-${RULES.username.max} characters` };
  if (val.length > RULES.username.max) return { valid: false, hint: `✗ Must be ${RULES.username.min}-${RULES.username.max} characters` };
  if (!RULES.username.pattern.test(val)) return { valid: false, hint: `✗ ${RULES.username.msg}` };
  return { valid: true, hint: "✓ Valid username" };
}

function validatePassword(val) {
  if (!val) return { valid: null, hint: "" };
  const remaining = Math.max(0, RULES.password.min - val.length);
  if (remaining > 0) return { valid: false, hint: `✗ ${remaining} more characters needed` };
  return { valid: true, hint: `✓ Strong (${val.length} chars)` };
}

function validateEmail(val) {
  if (!val) return { valid: null, hint: "" };
  if (!RULES.email.pattern.test(val)) return { valid: false, hint: "✗ Invalid email" };
  return { valid: true, hint: "" };
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: null, email: null, password: null });
  const [genericError, setGenericError] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  // Real-time validation hints
  const usernameHint = validateUsername(username);
  const passwordHint = validatePassword(password);
  const emailHint = validateEmail(email);

  const submit = async e => {
    e.preventDefault();
    setGenericError(null);
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/me");
    } catch (err) {
      // Check if it's a validation error with field-specific messages
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        // Generic error (e.g., user already exists)
        setGenericError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={"glass " + styles.form} onSubmit={submit}>
        <h1 className={"font-display " + styles.title}>Register</h1>
        <p className={styles.sub}>Join the community.</p>

        {genericError && <div className={styles.error}>{genericError}</div>}

        <label className={styles.label}>
          Username
          <input className={styles.input} type="text" value={username}
            onChange={e => setUsername(e.target.value)} required autoFocus
            placeholder="3–30 chars, letters/numbers/_" />
          {fieldErrors.username && <div className={styles.fieldError}>{fieldErrors.username}</div>}
          {!fieldErrors.username && usernameHint.hint && (
            <div className={styles.hint} style={{ color: usernameHint.valid ? "#10b981" : "#ef4444" }}>
              {usernameHint.hint}
            </div>
          )}
        </label>

        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          {fieldErrors.email && <div className={styles.fieldError}>{fieldErrors.email}</div>}
          {!fieldErrors.email && emailHint.hint && (
            <div className={styles.hint} style={{ color: emailHint.valid ? "#10b981" : "#ef4444" }}>
              {emailHint.hint}
            </div>
          )}
        </label>

        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)} required
            placeholder="Minimum 8 characters" />
          {fieldErrors.password && <div className={styles.fieldError}>{fieldErrors.password}</div>}
          {!fieldErrors.password && passwordHint.hint && (
            <div className={styles.hint} style={{ color: passwordHint.valid ? "#10b981" : "#ef4444" }}>
              {passwordHint.hint}
            </div>
          )}
        </label>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account →"}
        </button>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
