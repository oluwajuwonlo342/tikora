import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email: email.trim() });
      // Always show the same success message, so nobody can use this form
      // to find out which emails are registered.
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <MailCheck size={48} color="#00b060" style={{ marginBottom: "16px" }} />
            <h1>Check your email</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, we've sent a
              link to reset your password. The link expires soon, so use it
              right away. Check your spam folder if you don't see it.
            </p>
            <button
              type="button"
              className="btn btn-primary auth-submit"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              style={{ marginTop: "20px" }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <span className="page-label">ACCOUNT RECOVERY</span>
              <h1>Forgot password?</h1>
              <p>Enter your email and we'll send you a link to reset it.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <p style={{ color: "#cc0000", fontSize: "14px", margin: "0 0 12px" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <Link
            to="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
