import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
    const { logout } = useAuth();

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>Halo admin</h1>
            <p>Role: Event Organizer (EO) / Admin</p>
            <button
                onClick={logout}
                style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                }}
            >
                Logout
            </button>
        </div>
    );
}
