"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        background: "#f8f9fb",
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 400,
          background: "#fff",
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            T
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
              Tenakoe
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              CRM · Qualification RGE
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: "0 0 24px" }}>
          Connexion
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}
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
                border: "1px solid #e2e8f0",
                fontSize: 14,
                color: "#0f172a",
                outline: "none",
                background: "#f8f9fb",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}
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
                border: "1px solid #e2e8f0",
                fontSize: 14,
                color: "#0f172a",
                outline: "none",
                background: "#f8f9fb",
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
