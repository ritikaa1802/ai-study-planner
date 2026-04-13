import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export function ResetPasswordPage() {
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("token");
        if (t) setToken(t);
        else setError("Invalid or missing reset token.");
    }, []);

    const submit = async () => {
        if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || "Reset failed."); }
            else { setDone(true); }
        } catch {
            setError("Server error. Please try again.");
        }
        setLoading(false);
    };

    const base: React.CSSProperties = {
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "#f4f5fb",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
    };
    const card: React.CSSProperties = {
        width: "100%", maxWidth: 400, background: "#fff",
        borderRadius: 20, padding: "36px 36px",
        boxShadow: "0 8px 40px rgba(92,99,128,0.13)",
    };
    const input: React.CSSProperties = {
        width: "100%", padding: "12px 14px", borderRadius: 12,
        border: "1.5px solid #e8eaf4", background: "#fff", color: "#1e2235",
        fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        marginBottom: 14,
    };
    const btn: React.CSSProperties = {
        width: "100%", padding: "13px", borderRadius: 12, border: "none",
        background: loading ? "#b8bbdf" : "linear-gradient(135deg,#7b7ec8,#5c6380)",
        color: "#fff", fontSize: 15, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
    };

    if (done) return (
        <div style={base}>
            <div style={card}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2235", margin: "0 0 8px" }}>Password reset!</h2>
                    <p style={{ color: "#9298b0", fontSize: 14 }}>Your password has been updated. You can now sign in.</p>
                    <button onClick={() => window.location.href = "/"} style={{ ...btn, marginTop: 20 }}>
                        Go to Sign In
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={base}>
            <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7b7ec8,#5c6380)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontSize: 16 }}>✦</span>
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#1e2235" }}>StudyFlow</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2235", margin: "0 0 6px" }}>Choose a new password</h2>
                <p style={{ color: "#9298b0", fontSize: 14, margin: "0 0 24px" }}>Make it strong and memorable.</p>

                <label style={{ fontSize: 12, fontWeight: 700, color: "#5c6380", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={input} />

                <label style={{ fontSize: 12, fontWeight: 700, color: "#5c6380", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" style={input} />

                {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 14px" }}>{error}</p>}

                <button onClick={submit} disabled={loading || !token} style={btn}>
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </div>
        </div>
    );
}
