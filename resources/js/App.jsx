import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import VendorRegister from "./pages/auth/VendorRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EventOrdersPage from "./pages/admin/EventOrdersPage";
import EventCategoryPage from "./pages/admin/EventCategoryPage";
import AdminAccountPage from "./pages/admin/AdminAccountPage";
import VendorRegistrationPage from "./pages/admin/VendorRegistrationPage";
import KanbanPage from "./pages/admin/KanbanPage";
import PaymentVerificationPage from "./pages/admin/PaymentVerificationPage";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorPackageForm from "./pages/vendor/VendorPackageForm";
import VendorJobOffers from "./pages/vendor/VendorJobOffers";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientBookingPage from "./pages/client/ClientBookingPage";
import ClientBookedEventsPage from "./pages/client/ClientBookedEventsPage";
import PaymentTrackingPage from "./pages/client/PaymentTrackingPage";
import OfferReviewPage from "./pages/client/OfferReviewPage";
import VendorCatalogIndex from "./pages/vendors/VendorCatalogIndex";
import VendorCatalogShow from "./pages/vendors/VendorCatalogShow";

const queryClient = new QueryClient();

function RootRedirect() {
    const { isAuthenticated, user, isLoading, getRoleDashboard } = useAuth();

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-[#FAF6F0]">
                <div className="w-8 h-8 border-3 border-[#657166] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-[#738075]">Memuat sesi EVENTO...</p>
            </div>
        );
    }

    if (isAuthenticated && user) {
        return (
            <Navigate
                to={getRoleDashboard(user.role)}
                replace
            />
        );
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
                        <Route path="/register/vendor" element={<VendorRegister />} />
                        <Route path="/vendor/register" element={<VendorRegister />} />

                        {/* Template Layout Terpusat: Sidebar Dinamis & Header */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            {/* Rute Admin (EO) */}
                            <Route
                                path="/admin/orders"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <EventOrdersPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin/kanban"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <KanbanPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Master Kategori Acara untuk EO */}
                            <Route
                                path="/admin/categories"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <EventCategoryPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Pendaftaran & Review Vendor untuk EO */}
                            <Route
                                path="/admin/vendors"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <VendorRegistrationPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Verifikasi Pembayaran untuk EO */}
                            <Route
                                path="/admin/payments"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <PaymentVerificationPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Kelola Akun Admin untuk EO */}
                            <Route
                                path="/admin/admins"
                                element={
                                    <ProtectedRoute allowedRoles={["eo"]}>
                                        <AdminAccountPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute langsung untuk kemudahan pratinjau kanban */}
                            <Route
                                path="/kanban"
                                element={<KanbanPage />}
                            />

                            {/* Rute Vendor */}
                            <Route
                                path="/vendor/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["vendor"]}>
                                        <VendorDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Halaman Tawaran Pekerjaan dan Pekerjaan Aktif */}
                            <Route
                                path="/vendor/job-offers"
                                element={
                                    <ProtectedRoute allowedRoles={["vendor"]}>
                                        <VendorJobOffers />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Form Tambah Paket Vendor */}
                            <Route
                                path="/vendor/packages/create"
                                element={
                                    <ProtectedRoute allowedRoles={["vendor"]}>
                                        <VendorPackageForm />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Form Edit Paket Vendor */}
                            <Route
                                path="/vendor/packages/:id/edit"
                                element={
                                    <ProtectedRoute allowedRoles={["vendor"]}>
                                        <VendorPackageForm />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Client */}
                            <Route
                                path="/client/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["client"]}>
                                        <ClientDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Form Pengajuan Acara Baru */}
                            <Route
                                path="/client/booking"
                                element={
                                    <ProtectedRoute allowedRoles={["client"]}>
                                        <ClientBookingPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Acara yang Dibooking (Progress & Pembayaran per Acara) */}
                            <Route
                                path="/client/booked-events"
                                element={
                                    <ProtectedRoute allowedRoles={["client"]}>
                                        <ClientBookedEventsPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Payment Tracking untuk Client */}
                            <Route
                                path="/client/payments"
                                element={
                                    <ProtectedRoute allowedRoles={["client"]}>
                                        <PaymentTrackingPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Review Tawaran untuk Client */} 
                            <Route
                                path="/client/offers"
                                element={
                                    <ProtectedRoute allowedRoles={["client"]}>
                                        <OfferReviewPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Rute Fitur Katalog Vendor & Produk */}
                            <Route
                                path="/vendors"
                                element={
                                    <ProtectedRoute allowedRoles={["eo", "client", "vendor"]}>
                                        <VendorCatalogIndex />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/vendors/:slug"
                                element={
                                    <ProtectedRoute allowedRoles={["eo", "client", "vendor"]}>
                                        <VendorCatalogShow />
                                    </ProtectedRoute>
                                }
                            />
                            </Route>

                            {/* Fallback */}
                            <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                            />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}