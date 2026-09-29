import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";

const queryClient = new QueryClient();

function RootRedirect() {
    const { isAuthenticated, user, isLoading, getRoleDashboard } = useAuth();

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p>Memuat...</p>
            </div>
        );
    }

    if (isAuthenticated && user) {
        return <Navigate to={getRoleDashboard(user.role)} replace />;
    }

    return <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["eo"]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/vendor/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["vendor"]}>
                                    <VendorDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/client/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["client"]}>
                                    <ClientDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
