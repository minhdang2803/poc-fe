"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const LOGIN_ENDPOINT = "http://localhost:8080/login";

export default function HomePage() {
  const [username, setUsername] = useState("userngonqua");
  const [password, setPassword] = useState("P@ssword123");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { type: "success" | "error"; title: string; detail?: string }>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const rawText = await response.text();
      let parsedBody: unknown = null;

      if (rawText) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = rawText;
        }
      }

      if (!response.ok) {
        const message =
          typeof parsedBody === "object" && parsedBody !== null && "message" in parsedBody
            ? String((parsedBody as { message: unknown }).message)
            : `Login failed with status ${response.status}`;

        throw new Error(message);
      }

      const maybeToken =
        typeof parsedBody === "object" && parsedBody !== null && "access_token" in parsedBody
          ? (parsedBody as { access_token: unknown }).access_token
          : null;

      if (typeof maybeToken !== "string" || maybeToken.length === 0) {
        throw new Error("Login succeeded but no access_token was returned.");
      }

      window.localStorage.setItem("access_token", maybeToken);

      setStatus({
        type: "success",
        title: "Login successful",
        detail: "Redirecting to your profile…",
      });

      router.push("/profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error during login";
      setStatus({
        type: "error",
        title: message,
        detail: "Verify the API endpoint is reachable and supports cross-origin requests.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-card">
      <header>
        <h1>Welcome to nguyenlieu portal</h1>
        <p>Vui lòng đăng nhập để vào trang quản trị đặt hàng nguyenlieu</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>

      {status && (
        <div className={`status ${status.type}`}>
          <strong>{status.title}</strong>
          {status.detail && <small>{status.detail}</small>}
        </div>
      )}
    </section>
  );
}
