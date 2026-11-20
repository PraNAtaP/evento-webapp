import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles, requireVerified = true }) {
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

    // Jika akun klien atau vendor belum diverifikasi email-nya, wajib diarahkan ke halaman verifikasi email
    if (requireVerified && user && (user.role === "client" || user.role === "vendor") && !user.email_verified_at && user.is_email_verified !== true) {
        return <Navigate to="/verify-email" replace />;
    }

    return children ? children : <Outlet />;
}
