import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "16px",
          background: "var(--bg-void)", color: "var(--text-primary)", padding: "40px",
          fontFamily: "monospace",
        }}>
          <span style={{ fontSize: "32px", color: "var(--accent-danger)" }}>✕</span>
          <h2 style={{ color: "var(--accent-danger)", fontSize: "18px" }}>Something went wrong</h2>
          <pre style={{
            background: "var(--bg-surface)", color: "var(--accent-warm)",
            padding: "16px 24px", borderRadius: "8px", fontSize: "13px",
            maxWidth: "700px", overflowX: "auto", whiteSpace: "pre-wrap",
            border: "1px solid rgba(255,159,28,0.2)",
          }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--accent-primary)", color: "var(--bg-void)",
              border: "none", borderRadius: "8px", padding: "10px 24px",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
