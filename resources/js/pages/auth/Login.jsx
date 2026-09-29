import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, isAuthenticated, user, getRoleDashboard } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(getRoleDashboard(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate, getRoleDashboard]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const loggedInUser = await login(email, password);
            navigate(getRoleDashboard(loggedInUser.role), { replace: true });
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.errors) {
                const firstError = Object.values(err.response.data.errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError("Terjadi kesalahan saat login. Silakan coba lagi.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickFill = (testEmail, testPassword) => {
        setEmail(testEmail);
        setPassword(testPassword);
        setError("");
    };

    return (
        <div style={{ maxWidth: "420px", margin: "3rem auto", padding: "2rem", border: "1px solid #ddd", borderRadius: "8px", fontFamily: "sans-serif" }}>
            <h2>Login EVENTO</h2>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Masuk ke akun Customer, EO, atau Vendor</p>

            {error && (
                <div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "4px", fontSize: "0.875rem" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold", fontSize: "0.875rem" }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="contoh: client@evento.test"
                        style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box", border: "1px solid #ccc", borderRadius: "4px" }}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold", fontSize: "0.875rem" }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        style={{ width: "100%", padding: "0.5rem", boxSizing: "border-box", border: "1px solid #ccc", borderRadius: "4px" }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                    {isSubmitting ? "Memproses..." : "Masuk"}
                </button>
            </form>

            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px dashed #ccc" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#555" }}>Akun Demo Seeder (Klik untuk isi cepat):</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <button
                        type="button"
                        onClick={() => handleQuickFill("client@evento.test", "password")}
                        style={{ padding: "0.4rem 0.6rem", textAlign: "left", fontSize: "0.75rem", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
                    >
                        <strong>Customer:</strong> client@evento.test / password
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickFill("eo@evento.test", "password")}
                        style={{ padding: "0.4rem 0.6rem", textAlign: "left", fontSize: "0.75rem", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
                    >
                        <strong>EO (Admin):</strong> eo@evento.test / password
                    </button>
                    <button
                        type="button"
                        onClick={() => handleQuickFill("vendor@evento.test", "password")}
                        style={{ padding: "0.4rem 0.6rem", textAlign: "left", fontSize: "0.75rem", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
                    >
                        <strong>Vendor:</strong> vendor@evento.test / password
                    </button>
                </div>
            </div>
        </div>
    );
}
