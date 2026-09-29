import { useAuth } from "../../context/AuthContext";

export default function VendorDashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>Halo vendor {user?.name}</h1>
            <p>Role: Vendor</p>
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
