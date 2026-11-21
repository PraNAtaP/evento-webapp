import { useState, useEffect } from "react";
import {
    User,
    Lock,
    Camera,
    Save,
    Phone,
    MapPin,
    Building2,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

export default function ProfileSettingsPage() {
    const { user, setUser } = useAuth();

    const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'password'

    // Form Profil
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        bio: "",
        business_name: "",
        contact_number: "",
        description: "",
        bank_name: "",
        bank_account_number: "",
        bank_account_holder: "",
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    // Form Password
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/profile");
                const u = res.data?.data || {};
                setProfileData({
                    name: u.name || "",
                    email: u.email || "",
                    phone: u.phone || u.vendor?.contact_number || "",
                    address: u.address || u.vendor?.address || "",
                    bio: u.bio || "",
                    business_name: u.vendor?.business_name || "",
                    contact_number: u.vendor?.contact_number || "",
                    description: u.vendor?.description || "",
                    bank_name: u.vendor?.bank_name || "",
                    bank_account_number: u.vendor?.bank_account_number || "",
                    bank_account_holder: u.vendor?.bank_account_holder || "",
                });
                if (u.avatar_url || u.vendor?.image_url) {
                    setAvatarPreview(u.avatar_url || u.vendor?.image_url);
                }
            } catch (err) {
                console.error("Gagal memuat profil:", err);
            }
        };

        fetchProfile();
    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess("");
        setProfileError("");

        try {
            const formData = new FormData();
            formData.append("name", profileData.name);
            formData.append("phone", profileData.phone);
            formData.append("address", profileData.address);
            formData.append("bio", profileData.bio);

            if (user?.role === "vendor") {
                formData.append("business_name", profileData.business_name);
                formData.append("description", profileData.description);
                formData.append("contact_number", profileData.phone);
                formData.append("bank_name", profileData.bank_name);
                formData.append("bank_account_number", profileData.bank_account_number);
                formData.append("bank_account_holder", profileData.bank_account_holder);
            }

            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const res = await api.post("/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const updatedUser = res.data?.data;
            if (updatedUser && setUser) {
                setUser((prev) => ({ ...prev, ...updatedUser }));
            }

            setProfileSuccess(res.data?.message || "Profil berhasil diperbarui!");
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(" ")
                    : "Gagal memperbarui profil.");
            setProfileError(msg);
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordSuccess("");
        setPasswordError("");

        if (passwordData.password !== passwordData.password_confirmation) {
            setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
            setPasswordLoading(false);
            return;
        }

        try {
            const res = await api.post("/profile/change-password", passwordData);
            setPasswordSuccess(res.data?.message || "Kata sandi berhasil diperbarui.");
            setPasswordData({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
        } catch (err) {
            const msg =
                err.response?.data?.errors?.current_password?.[0] ||
                err.response?.data?.errors?.password?.[0] ||
                err.response?.data?.message ||
                "Gagal mengganti kata sandi.";
            setPasswordError(msg);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            {/* Header Profil */}
            <div className="bg-white rounded-3xl border border-[#E8E2D7] p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#657166] text-[#FDE8D3] font-black text-2xl flex items-center justify-center border-2 border-[#E8E2D7] shadow-xs">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt={profileData.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{(profileData.name || "U").charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1.5 bg-[#2F3931] hover:bg-[#657166] text-white rounded-xl shadow-md cursor-pointer transition-transform transform group-hover:scale-105 border border-white">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-[#2F3931]">
                                {profileData.name || "Pengguna"}
                            </h1>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#DAEBE3] text-[#224436] border border-[#BCD4C9]">
                                {user?.role === "eo" ? "EO Admin" : user?.role === "vendor" ? "Mitra Vendor" : "Klien"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#738075] mt-1">{profileData.email}</p>
                        <p className="text-[11px] text-[#A0AAA2] mt-0.5">
                            Kelola informasi data pribadi dan keamanan akun EVENTO Anda.
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex sm:flex-col bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#E8E2D7] w-full sm:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "profile"
                                ? "bg-white text-[#2F3931] shadow-xs border border-[#E8E2D7]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        <User className="w-4 h-4" />
                        <span>Informasi Profil</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("password")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "password"
                                ? "bg-white text-[#2F3931] shadow-xs border border-[#E8E2D7]"
                                : "text-[#738075] hover:text-[#2F3931]"
                        }`}
                    >
                        <Lock className="w-4 h-4" />
                        <span>Ganti Password</span>
                    </button>
                </div>
            </div>

            {/* Konten Tab 1: Form Profil */}
            {activeTab === "profile" && (
                <div className="bg-white rounded-3xl border border-[#E8E2D7] p-6 sm:p-8 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#E8E2D7]">
                        <User className="w-5 h-5 text-[#657166]" />
                        <div>
                            <h2 className="text-base font-extrabold text-[#2F3931]">
                                Informasi Profil Akun
                            </h2>
                            <p className="text-xs text-[#738075]">
                                Perbarui nama, nomor kontak WhatsApp, dan informasi terkait lainnya.
                            </p>
                        </div>
                    </div>

                    {profileSuccess && (
                        <div role="alert" className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{profileSuccess}</span>
                        </div>
                    )}

                    {profileError && (
                        <div role="alert" className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{profileError}</span>
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                    Nama Lengkap / Kontak Person *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                    Alamat Email (Akun Utama)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={profileData.email}
                                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 cursor-not-allowed"
                                />
                                <span className="text-[10px] text-[#738075] mt-1 block">
                                    Email terikat dengan identitas otentikasi login akun Anda.
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-[#657166]" />
                                    <span>Nomor Telepon / WhatsApp</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: 081234567890"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#2F3931] mb-1.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#657166]" />
                                    <span>Alamat / Lokasi Domisili</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Kota / Alamat lengkap Anda"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#657166]" />
                                <span>Bio / Deskripsi Profil</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Tuliskan catatan singkat mengenai profil atau preferensi Anda..."
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                            />
                        </div>

                        {/* Bidang Khusus Vendor Mitra */}
                        {user?.role === "vendor" && (
                            <div className="pt-5 mt-5 border-t border-[#E8E2D7]">
                                <div className="flex items-center gap-2 mb-4">
                                    <Building2 className="w-4 h-4 text-[#657166]" />
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2F3931]">
                                        Informasi Bisnis Vendor Mitra
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                            Nama Brand / Usaha Vendor
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.business_name}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, business_name: e.target.value })
                                            }
                                            className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                            Deskripsi Usaha & Portofolio
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={profileData.description}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, description: e.target.value })
                                            }
                                            className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                        />
                                    </div>

                                    {/* Rekening Bank untuk Payout */}
                                    <div className="p-4 bg-[#FAF6F0]/60 rounded-2xl border border-[#E8E2D7]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CreditCard className="w-4 h-4 text-[#657166]" />
                                            <span className="text-xs font-bold text-[#2F3931]">
                                                Rekening Pencairan Dana (Payout)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#738075] mb-1">
                                                    Nama Bank
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: BCA, Mandiri"
                                                    value={profileData.bank_name}
                                                    onChange={(e) =>
                                                        setProfileData({ ...profileData, bank_name: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 bg-white border border-[#E8E2D7] rounded-xl text-xs text-[#2F3931]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#738075] mb-1">
                                                    Nomor Rekening
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: 1234567890"
                                                    value={profileData.bank_account_number}
                                                    onChange={(e) =>
                                                        setProfileData({
                                                            ...profileData,
                                                            bank_account_number: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 bg-white border border-[#E8E2D7] rounded-xl text-xs text-[#2F3931]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#738075] mb-1">
                                                    Atas Nama Rekening
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Nama pemilik buku tabungan"
                                                    value={profileData.bank_account_holder}
                                                    onChange={(e) =>
                                                        setProfileData({
                                                            ...profileData,
                                                            bank_account_holder: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 bg-white border border-[#E8E2D7] rounded-xl text-xs text-[#2F3931]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="px-6 py-2.5 rounded-xl bg-[#657166] hover:bg-[#4E594F] text-[#FAF6F0] font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                <span>{profileLoading ? "Menyimpan..." : "Simpan Perubahan Profil"}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Konten Tab 2: Ganti Password */}
            {activeTab === "password" && (
                <div className="bg-white rounded-3xl border border-[#E8E2D7] p-6 sm:p-8 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#E8E2D7]">
                        <Lock className="w-5 h-5 text-[#657166]" />
                        <div>
                            <h2 className="text-base font-extrabold text-[#2F3931]">
                                Keamanan & Ganti Kata Sandi
                            </h2>
                            <p className="text-xs text-[#738075]">
                                Pastikan akun Anda aman dengan menggunakan kata sandi yang kuat dan unik.
                            </p>
                        </div>
                    </div>

                    {passwordSuccess && (
                        <div role="alert" className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{passwordSuccess}</span>
                        </div>
                    )}

                    {passwordError && (
                        <div role="alert" className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{passwordError}</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Kata Sandi Saat Ini *
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    required
                                    value={passwordData.current_password}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, current_password: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 pr-10 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-2.5 text-[#738075] hover:text-[#2F3931] cursor-pointer"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Kata Sandi Baru * (Minimal 8 Karakter)
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={passwordData.password}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, password: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 pr-10 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-2.5 text-[#738075] hover:text-[#2F3931] cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#2F3931] mb-1.5">
                                Konfirmasi Kata Sandi Baru *
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={passwordData.password_confirmation}
                                onChange={(e) =>
                                    setPasswordData({
                                        ...passwordData,
                                        password_confirmation: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2.5 bg-[#FAF6F0]/50 border border-[#E8E2D7] focus:border-[#657166] rounded-xl text-xs text-[#2F3931] outline-hidden transition"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full py-2.5 rounded-xl bg-[#657166] hover:bg-[#4E594F] text-[#FAF6F0] font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                <Lock className="w-4 h-4" />
                                <span>{passwordLoading ? "Memproses..." : "Perbarui Kata Sandi"}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
