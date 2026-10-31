export default function InspectorSection({ title, children }) {
    return (
        <section className="py-4 border-b border-[#E8E2D7] last:border-b-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#738075] mb-3">
                {title}
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
        </section>
    );
}
