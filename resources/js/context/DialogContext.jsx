import { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Toast from '../components/ui/Toast';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "Konfirmasi",
        message: "",
        confirmText: "Ya, Lanjutkan",
        cancelText: "Batal",
        isDanger: false,
        isAlert: false,
        type: "info",
        onConfirm: () => {},
        onCancel: () => {},
    });

    const [toastState, setToastState] = useState({
        message: "",
        type: "success",
        duration: 3500,
    });

    /**
     * Membuka modal konfirmasi kustom dengan 2 tombol (Batal & Konfirmasi).
     * Mengembalikan Promise<boolean>: true jika pengguna mengonfirmasi, false jika batal.
     *
     * @param {Object} options
     * @param {string} [options.title="Konfirmasi"]
     * @param {string} options.message
     * @param {string} [options.confirmText="Ya, Lanjutkan"]
     * @param {string} [options.cancelText="Batal"]
     * @param {boolean} [options.isDanger=false]
     * @param {"info"|"warning"|"danger"|"success"} [options.type]
     * @returns {Promise<boolean>}
     */
    const showConfirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            const isDanger = !!options.isDanger;
            const resolvedType = options.type || (isDanger ? "danger" : "warning");

            setModalState({
                isOpen: true,
                title: options.title || "Konfirmasi",
                message: options.message || "",
                confirmText: options.confirmText || "Ya, Lanjutkan",
                cancelText: options.cancelText || "Batal",
                isDanger,
                isAlert: false,
                type: resolvedType,
                onConfirm: () => {
                    setModalState((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setModalState((prev) => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    /**
     * Membuka modal pesan/alert kustom dengan 1 tombol (Mengerti).
     * Menerima string pesan sederhana ATAU objek konfigurasi lengkap.
     * Mengembalikan Promise<void>.
     *
     * @param {string|Object} options
     * @param {string} [options.title]
     * @param {string} options.message
     * @param {string} [options.confirmText="Mengerti"]
     * @param {"info"|"warning"|"danger"|"success"|"error"} [options.type="info"]
     * @returns {Promise<void>}
     */
    const showAlert = useCallback((options = {}) => {
        return new Promise((resolve) => {
            const opts = typeof options === 'string' ? { message: options } : (options || {});
            const isDanger = opts.type === 'danger' || opts.type === 'error' || !!opts.isDanger;
            const resolvedType = opts.type === 'error' ? 'danger' : (opts.type || (isDanger ? 'danger' : 'info'));

            let defaultTitle = "Pemberitahuan";
            if (resolvedType === 'danger') defaultTitle = "Peringatan";
            else if (resolvedType === 'success') defaultTitle = "Berhasil";
            else if (resolvedType === 'warning') defaultTitle = "Perhatian";

            setModalState({
                isOpen: true,
                title: opts.title || defaultTitle,
                message: opts.message || "",
                confirmText: opts.confirmText || "Mengerti",
                cancelText: null,
                isDanger,
                isAlert: true,
                type: resolvedType,
                onConfirm: () => {
                    setModalState((prev) => ({ ...prev, isOpen: false }));
                    resolve();
                },
                onCancel: () => {
                    setModalState((prev) => ({ ...prev, isOpen: false }));
                    resolve();
                },
            });
        });
    }, []);

    /**
     * Menampilkan notifikasi Toast mengambang di pojok layar.
     *
     * @param {Object} options
     * @param {string} options.message
     * @param {"success"|"error"} [options.type="success"]
     * @param {number} [options.duration=3500]
     */
    const showToast = useCallback((options = {}) => {
        const opts = typeof options === 'string' ? { message: options } : (options || {});
        setToastState({
            message: opts.message || "",
            type: opts.type === 'error' || opts.type === 'danger' ? 'error' : 'success',
            duration: opts.duration || 3500,
        });
    }, []);

    const closeToast = useCallback(() => {
        setToastState((prev) => ({ ...prev, message: "" }));
    }, []);

    return (
        <DialogContext.Provider
            value={{
                showConfirm,
                showAlert,
                showToast,
                confirm: showConfirm,
                alert: showAlert,
                toast: showToast,
            }}
        >
            {children}

            {/* Modal Konfirmasi & Alert Kustom Global */}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                isDanger={modalState.isDanger}
                isAlert={modalState.isAlert}
                type={modalState.type}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
            />

            {/* Toast Notifikasi Global */}
            <Toast
                type={toastState.type}
                message={toastState.message}
                duration={toastState.duration}
                onClose={closeToast}
            />
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
