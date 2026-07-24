import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResetToken(null);
    try {
      const result = await api.post<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
        email,
      });
      setResetToken(result.resetToken ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    }
  }

  return (
    <div className="auth-page">
      <h1>Forgot password</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Send reset token</button>
      </form>
      {resetToken && (
        <div className="demo-stub-note">
          <p>
            Demo stub — no email is sent. Use this token on the{" "}
            <Link to={`/reset-password/${resetToken}`}>reset password page</Link>.
          </p>
        </div>
      )}
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}
