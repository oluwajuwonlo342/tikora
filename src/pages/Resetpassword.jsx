import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "../services/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  const inputStyle = { width: "100%", paddingRight: "40px", boxSizing: "border-box" };

  return (
    <main className="auth-page">
      <div className="auth-card">
        {done ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={48} color="#00b060" style={{ marginBottom: "16px" }} />
            <h1>Password updated</h1>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              Your password has been changed. Taking you to the login page...
            </p>
            <Link to="/login" className="btn btn-primary auth-submit" style={{ display: "inline-block", marginTop: "16px", textAlign: "center", textDecoration: "none" }}>
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <span className="page-label">ACCOUNT RECOVERY</span>
              <h1>Reset password</h1>
              <p>Choose a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={toggleStyle}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm new password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p style={{ color: "#cc0000", fontSize: "14px", margin: "0 0 12px" }}>
                  {error}{" "}
                  {error.toLowerCase().includes("expired") && (
                    <Link to="/forgot-password">Request a new link</Link>
                  )}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default ResetPassword;
