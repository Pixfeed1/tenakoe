"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LIGHT, DARK } from "@/lib/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("tenakoe-dark") === "true"); }, []);
  const C = dark ? DARK : LIGHT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        transition: "background 0.3s",
      }}
    >
      <div
        className="login-card"
        style={{
          width: 400,
          maxWidth: "calc(100vw - 32px)",
          background: C.surface,
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: `1px solid ${C.border}`,
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Tenakoe"
            style={{ width: 44, height: 44, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>
              Tenakoe
            </div>
            <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>
              CRM · Qualification RGE
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 24px" }}>
          Connexion
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 6 }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elise@tenakoe.fr"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                color: C.text,
                outline: "none",
                background: C.bg,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 6 }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                color: C.text,
                outline: "none",
                background: C.bg,
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(220,38,38,0.06)",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
