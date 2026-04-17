import { apiFetch } from "../utils/api";

import { useState } from "react";

// ── Minimal icon helper ───────────────────────────────────
function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const I = {
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  arrow: "M19 12H5 M12 5l-7 7 7 7",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  arrowR: "M5 12h14 M12 5l7 7-7 7",
};

type View = "register" | "login" | "forgot";

interface AuthPageProps {
  onLogin?: () => void;
}

// ── Floating dot background ───────────────────────────────
function Background() {
  const dots = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 137.5) % 100,
    y: (i * 93.7) % 100,
    size: 3 + (i % 4) * 2,
    delay: (i * 0.4) % 3,
    dur: 4 + (i % 3),
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Gradient mesh */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 20% 20%, #c8cbf0 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 80%, #b8bbdf 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 50%, #f4f5fb 0%, transparent 100%)" }} />
      {/* Soft grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(123,126,200,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(123,126,200,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      {/* Floating dots */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <style>{`
          @keyframes floatDot {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.35; }
            50% { transform: translateY(-14px) scale(1.15); opacity: 0.6; }
          }
        `}</style>
        {dots.map((d) => (
          <circle key={d.id} cx={`${d.x}%`} cy={`${d.y}%`} r={d.size}
            fill="#7b7ec8"
            style={{ animation: `floatDot ${d.dur}s ${d.delay}s ease-in-out infinite`, opacity: 0.35 }} />
        ))}
      </svg>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, icon, rightEl, error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: string;
  rightEl?: React.ReactNode;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#5c6380", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 14, pointerEvents: "none", zIndex: 1 }}>
          <Ic d={icon} size={16} color={focused ? "#7b7ec8" : "#9298b0"} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "12px 14px 12px 42px",
            borderRadius: 12,
            border: `1.5px solid ${error ? "#ef4444" : focused ? "#7b7ec8" : "#e8eaf4"}`,
            background: "#fff",
            color: "#1e2235",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
            paddingRight: rightEl ? 48 : 14,
          }}
        />
        {rightEl && (
          <div style={{ position: "absolute", right: 14, cursor: "pointer" }}>{rightEl}</div>
        )}
      </div>
      {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

// ── Password field with show/hide ─────────────────────────
function PasswordField({ label, value, onChange, error, placeholder = "••••••••" }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={I.lock}
      error={error}
      rightEl={
        <div onClick={() => setShow((s) => !s)}>
          <Ic d={show ? I.eyeOff : I.eye} size={16} color="#9298b0" />
        </div>
      }
    />
  );
}

// ── Strength bar ──────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#e8eaf4", "#ef4444", "#f59e0b", "#7b7ec8", "#22c55e"];
  if (!password) return null;
  return (
    <div style={{ marginBottom: 16, marginTop: -8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= score ? colors[score] : "#e8eaf4", transition: "background 0.3s" }} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

// ── Register ──────────────────────────────────────────────
function Register({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
        skipAuthRedirect: true,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // non-JSON responses may happen on rate-limiting or other edge cases
        data = { error: res.statusText || "Server error" };
      }

      if (!res.ok) {
        setErrors({ email: data.error || data.message || "Registration failed" });
        setLoading(false);
        return;
      }

      // Registration success, redirect to login
      setLoading(false);
      setDone(true);
      setTimeout(() => {
        onSwitch("login");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setErrors({ email: `Server error: ${err.message || 'Network error'}` });
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Ic d={I.check} size={28} color="#22c55e" sw={2} />
        </div>
        <h3 className="auth-form-title" style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1e2235" }}>Account Created!</h3>
        <p style={{ margin: 0, fontSize: 14, color: "#9298b0" }}>Logging you in...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 className="auth-form-title" style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#1e2235", letterSpacing: "-0.5px" }}>Create your account</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#9298b0" }}>Start your study journey with StudyFlow</p>
      </div>

      <Field label="Full Name" value={name} onChange={setName} placeholder="Rits Student" icon={I.user} error={errors.name} />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="rits@example.com" icon={I.mail} error={errors.email} />
      <PasswordField label="Password" value={password} onChange={setPassword} error={errors.password} />
      <StrengthBar password={password} />
      <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} error={errors.confirm} placeholder="Repeat password" />

      {/* Terms */}
      <p style={{ margin: "4px 0 20px", fontSize: 12, color: "#9298b0", lineHeight: 1.6 }}>
        By registering, you agree to our{" "}
        <span style={{ color: "#7b7ec8", cursor: "pointer", fontWeight: 600 }}>Terms of Service</span>{" "}
        and{" "}
        <span style={{ color: "#7b7ec8", cursor: "pointer", fontWeight: 600 }}>Privacy Policy</span>.
      </p>

      <button onClick={submit} disabled={loading}
        style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading ? "#b8bbdf" : "linear-gradient(135deg, #7b7ec8, #5c6380)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s", letterSpacing: "0.01em" }}>
        {loading
          ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Creating account...</>
          : <><Ic d={I.arrowR} size={16} color="#fff" /> Create Account</>
        }
      </button>

      <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 14, color: "#9298b0" }}>
        Already have an account?{" "}
        <span onClick={() => onSwitch("login")} style={{ color: "#7b7ec8", fontWeight: 700, cursor: "pointer" }}>Sign in</span>
      </p>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────
function Login({ onSwitch, onLogin }: { onSwitch: (v: View) => void; onLogin?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        }),
        skipAuthRedirect: true,
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setErrors({ password: (data as any).error || (data as any).message || "Login failed" });
        setLoading(false);
        return;
      }

      // ✅ Save JWT token
      localStorage.setItem("token", (data as any).accessToken);

      setLoading(false);
      onLogin?.();

    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setErrors({ password: `Server error: ${err.message || 'Network error'}` });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 className="auth-form-title" style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#1e2235" }}>
          Welcome back
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#9298b0" }}>
          Sign in to continue your study session
        </p>
      </div>

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="rits@example.com"
        icon={I.mail}
        error={errors.email}
      />

      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
        <label style={{ fontSize: 13, color: "#5c6380" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={() => setRemember(!remember)}
            style={{
              marginRight: 6,
              appearance: "none",
              WebkitAppearance: "none",
              width: 14,
              height: 14,
              borderRadius: 3,
              border: "1.5px solid #bfc5dc",
              background: remember ? "#7b7ec8" : "#ffffff",
              boxShadow: remember ? "inset 0 0 0 2px #ffffff" : "none",
              verticalAlign: "middle",
              cursor: "pointer"
            }}
          />
          Remember me
        </label>

        <span
          onClick={() => onSwitch("forgot")}
          style={{ fontSize: 13, color: "#7b7ec8", fontWeight: 700, cursor: "pointer" }}
        >
          Forgot password?
        </span>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          border: "none",
          background: loading ? "#b8bbdf" : "linear-gradient(135deg, #7b7ec8, #5c6380)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#1e2235" }}>
        Don't have an account?{" "}
        <span
          onClick={() => onSwitch("register")}
          style={{ color: "#7b7ec8", fontWeight: 700, cursor: "pointer" }}
        >
          Create one
        </span>
      </p>
    </div>
  );
}
// ── Forgot Password ───────────────────────────────────────
function ForgotPassword({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        skipAuthRedirect: true,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setDevResetUrl(typeof data.resetUrl === "string" ? data.resetUrl : "");
      setLoading(false);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(`Server error: ${err.message || 'Network error'}`);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 className="auth-form-title" style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#1e2235", letterSpacing: "-0.5px" }}>Check your email</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#9298b0" }}>We've sent a reset link to your inbox</p>
        </div>

        <div style={{ padding: "20px 24px", borderRadius: 16, background: "#ffffff", border: "1.5px solid #e8eaf4", marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(123,126,200,0.15)" }}>
            <Ic d={I.mail} size={18} color="#7b7ec8" />
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1e2235" }}>Reset link sent to</p>
            <p style={{ margin: 0, fontSize: 13, color: "#7b7ec8", fontWeight: 700 }}>{email}</p>
          </div>
        </div>

        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9298b0", lineHeight: 1.7 }}>
          Didn't receive it? Check your spam folder, or{" "}
          <span onClick={() => setSent(false)} style={{ color: "#7b7ec8", fontWeight: 600, cursor: "pointer" }}>try again</span>.
        </p>

        {devResetUrl && (
          <div style={{ margin: "0 0 24px", padding: "12px 14px", borderRadius: 12, border: "1px dashed #c9cee5", background: "#f7f8ff" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#5c6380", fontWeight: 700 }}>Development reset link</p>
            <a href={devResetUrl} style={{ fontSize: 12, color: "#4f46e5", wordBreak: "break-all", textDecoration: "underline" }}>
              {devResetUrl}
            </a>
          </div>
        )}

        <button onClick={() => onSwitch("login")}
          style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1.5px solid #e8eaf4", background: "#fff", color: "#1e2235", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Ic d={I.arrow} size={16} color="#5c6380" /> Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => onSwitch("login")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#9298b0", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 24 }}>
        <Ic d={I.arrow} size={15} color="#9298b0" /> Back to Sign In
      </button>

      <div style={{ marginBottom: 28 }}>
        <h2 className="auth-form-title" style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#1e2235", letterSpacing: "-0.5px" }}>Forgot password?</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#9298b0", lineHeight: 1.6 }}>No worries. Enter your email and we'll send you a reset link.</p>
      </div>

      <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="rits@example.com" icon={I.mail} error={error} />

      <button onClick={submit} disabled={loading}
        style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading ? "#b8bbdf" : "linear-gradient(135deg, #7b7ec8, #5c6380)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.01em", marginTop: 4 }}>
        {loading
          ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Sending link...</>
          : <><Ic d={I.mail} size={16} color="#fff" /> Send Reset Link</>
        }
      </button>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────
export function AuthPage({ onLogin }: AuthPageProps) {
  const [view, setView] = useState<View>("register");

  const titles: Record<View, string> = {
    register: "Join 10,000+ students",
    login: "Welcome back",
    forgot: "Reset your password",
  };

  return (
    <div className="auth-root" style={{ display: "flex", height: "100vh", width: "100%", fontFamily: "'DM Sans','Segoe UI',sans-serif", overflow: "hidden", position: "relative", background: "#f4f5fb" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .auth-root {
          overflow-x: hidden;
        }

        @media (max-width: 1023px) {
          .auth-left {
            display: none !important;
          }

          .auth-right {
            width: 100% !important;
            padding: 24px 16px !important;
          }

          .auth-card {
            width: 100% !important;
            max-width: 560px !important;
            border-radius: 18px !important;
            padding: 28px 18px !important;
          }
        }

        @media (max-width: 480px) {
          .auth-root {
            min-height: 100dvh !important;
            height: auto !important;
            overflow-y: auto !important;
          }

          .auth-right {
            align-items: flex-start !important;
            padding: 16px 12px !important;
          }

          .auth-card {
            border-radius: 14px !important;
            padding: 22px 14px !important;
          }

          .auth-form-title {
            font-size: 22px !important;
            line-height: 1.25 !important;
          }
        }
      `}</style>

      <Background />

      {/* ── Left panel — branding ── */}
      <div className="auth-left" style={{ width: "45%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #7b7ec8, #5c6380)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(123,126,200,0.4)" }}>
            <Ic d={I.star} size={18} color="#fff" sw={2} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1e2235", letterSpacing: "-0.5px" }}>StudyFlow</span>
        </div>

        {/* Headline */}
        <h1 style={{ margin: "0 0 16px", fontSize: 40, fontWeight: 800, color: "#1e2235", letterSpacing: "-1px", lineHeight: 1.15 }}>
          Learn smarter,<br />
          <span style={{ background: "linear-gradient(135deg, #7b7ec8, #5c6380)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>not harder.</span>
        </h1>
        <p style={{ margin: "0 0 48px", fontSize: 16, color: "#9298b0", lineHeight: 1.7, maxWidth: 340 }}>
          AI-powered study planning, goal tracking, and focus tools — all in one place.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: I.spark, text: "AI study plans tailored to your schedule" },
            { icon: I.check, text: "Track goals and tasks with visual progress" },
            { icon: I.star, text: "Gamified streaks and XP to stay motivated" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ffffff", border: "1px solid #e8eaf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic d={f.icon} size={15} color="#7b7ec8" />
              </div>
              <span style={{ fontSize: 14, color: "#5c6380", fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 52, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex" }}>
            {["#7b7ec8", "#5c6380", "#8f94cc", "#3c4090"].map((c, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #f4f5fb", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {["R", "A", "M", "S"][i]}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width={12} height={12} viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#9298b0" }}>Loved by <strong style={{ color: "#5c6380" }}>10,000+</strong> students</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 60px", position: "relative", zIndex: 1 }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 24, padding: "40px 40px", boxShadow: "0 8px 40px rgba(92,99,128,0.12), 0 1px 4px rgba(0,0,0,0.06)", animation: "slideIn 0.45s ease both" }}>
          {/* Step indicator — only on register/login */}
          {view !== "forgot" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              {(["register", "login"] as View[]).map((v) => (
                <div key={v} onClick={() => setView(v)} style={{ flex: 1, height: 3, borderRadius: 999, background: view === v ? "#7b7ec8" : "#e8eaf4", cursor: "pointer", transition: "background 0.25s" }} />
              ))}
            </div>
          )}

          <div style={{ animation: "fadeIn 0.3s ease both" }} key={view}>
            {view === "register" && <Register onSwitch={setView} />}
            {view === "login" && <Login onSwitch={setView} onLogin={onLogin} />}
            {view === "forgot" && <ForgotPassword onSwitch={setView} />}
          </div>
        </div>
      </div>
    </div>
  );
}
