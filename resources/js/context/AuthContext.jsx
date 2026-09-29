import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem("auth_token");
            if (!savedToken) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get("/user");
                setUser(response.data.user);
            } catch (error) {
                console.error("Gagal memuat sesi pengguna:", error);
                localStorage.removeItem("auth_token");
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/login", { email, password });
        const { token: newToken, user: newUser } = response.data;

        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        setUser(newUser);

        return newUser;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            localStorage.removeItem("auth_token");
            setToken(null);
            setUser(null);
        }
    };

    const getRoleDashboard = (role) => {
        switch (role) {
            case "eo":
                return "/admin/dashboard";
            case "vendor":
                return "/vendor/dashboard";
            case "client":
            default:
                return "/client/dashboard";
        }
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        getRoleDashboard,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth harus digunakan di dalam AuthProvider");
    }
    return context;
}
