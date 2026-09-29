import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated, isLoading, getRoleDashboard } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p>Memuat sesi...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={getRoleDashboard(user.role)} replace />;
    }

    return children;
}
