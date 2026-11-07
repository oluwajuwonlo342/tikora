import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "../services/api";

// Same password rule as register
const PASSWORD_REGEX =
  /^(?=.*[0-9])(?=.*[!@#$%^&*.,_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const cardStyle = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  marginBottom: "24px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#555",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const primaryBtn = {
  background: "#ff5a36",
  color: "white",
  border: "none",
  padding: "12px 22px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

function Message({ type, children }) {
  if (!children) return null;
  const isError = type === "error";
  return (
    <p
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        margin: "0 0 14px",
        padding: "10px 14px",
        borderRadius: "10px",
        fontSize: "14px",
        background: isError ? "#ffe6e6" : "#e6f7ee",
        color: isError ? "#cc0000" : "#00804a",
      }}
    >
      {!isError && <CheckCircle size={16} />}
      {children}
    </p>
  );
}

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  // Profile form
  const [profile, setProfile] = useState({ name: "", phone: "", email: "", currentPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (!stored) throw new Error("No user");
      setUser(stored);
      setProfile({ name: stored.name || "", phone: stored.phone || "", email: stored.email || "", currentPassword: "" });
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!profile.name.trim()) {
      setProfileMsg({ type: "error", text: "Name is required." });
      return;
    }

    const newEmail = profile.email.trim().toLowerCase();
    const emailChanged = newEmail !== (user.email || "").toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setProfileMsg({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (emailChanged && !profile.currentPassword) {
      setProfileMsg({ type: "error", text: "Enter your current password to change your email." });
      return;
    }

    try {
      setProfileSaving(true);
      const res = await api.put("/auth/profile", {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        email: newEmail,
        ...(emailChanged ? { currentPassword: profile.currentPassword } : {}),
      });

      if (res.data.success) {
        // Keep the saved login info in sync so the dashboard shows the new name
        const updated = { ...user, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setProfile((prev) => ({ ...prev, email: updated.email || "", currentPassword: "" }));
        setProfileMsg({ type: "success", text: res.data.message || "Profile updated." });
      }
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Could not update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 8 characters long, containing at least one number and one special character.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordMsg({ type: "success", text: "Password changed successfully." });
      }
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Could not change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return null;

  const passwordType = showPasswords ? "text" : "password";

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px" }}>
      <Link
        to="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          textDecoration: "none",
          color: "#555",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <h1 style={{ fontSize: "32px", color: "#111", margin: "0 0 6px" }}>Settings</h1>
      <p style={{ color: "#777", margin: "0 0 30px" }}>
        Manage your name, email, phone number and password.
      </p>

      {/* PROFILE */}
      <section style={cardStyle}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", margin: "0 0 20px" }}>
          <User size={22} color="#ff5a36" /> Profile
        </h2>

        <form onSubmit={handleProfileSubmit}>
          <Message type={profileMsg.type}>{profileMsg.text}</Message>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Full name</label>
            <input
              style={inputStyle}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              style={inputStyle}
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </div>

          {/* Only shown when the email is being changed */}
          {profile.email.trim().toLowerCase() !== (user.email || "").toLowerCase() && (
            <div style={{ marginBottom: "16px", background: "#fff4e0", padding: "14px", borderRadius: "10px" }}>
              <label style={{ ...labelStyle, color: "#8a5200" }}>
                Current password (needed to change your email)
              </label>
              <input
                type="password"
                style={inputStyle}
                value={profile.currentPassword}
                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#8a5200" }}>
                You will use the new email to log in from now on. Check it carefully, because password reset links are sent there.
              </p>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Phone number</label>
            <input
              style={inputStyle}
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="e.g. 08012345678"
            />
          </div>

          <button type="submit" style={primaryBtn} disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      {/* CHANGE PASSWORD */}
      <section style={cardStyle}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", margin: "0 0 20px" }}>
          <Lock size={22} color="#ff5a36" /> Change password
        </h2>

        <form onSubmit={handlePasswordSubmit}>
          <Message type={passwordMsg.type}>{passwordMsg.text}</Message>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Current password</label>
            <input
              type={passwordType}
              style={inputStyle}
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>New password</label>
            <input
              type={passwordType}
              style={inputStyle}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="At least 8 characters, 1 number, 1 symbol"
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Confirm new password</label>
            <input
              type={passwordType}
              style={inputStyle}
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: "13px",
              padding: 0,
              marginBottom: "20px",
            }}
          >
            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          <div>
            <button type="submit" style={primaryBtn} disabled={passwordSaving}>
              {passwordSaving ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Settings;