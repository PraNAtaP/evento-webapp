export default function InspectorField({ label, children, fullWidth = false }) {
    return (
        <div className={fullWidth ? "sm:col-span-2" : ""}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{children}</dd>
        </div>
    );
}
