import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Breadcrumb({
    items = [],
    showBackButton = true,
    backUrl,
    className = "",
}) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}>
            <nav className="flex items-center gap-1.5 text-[#738075]" aria-label="Breadcrumb">
                <Link
                    to="/vendors"
                    className="hover:text-[#2F3931] font-medium transition-colors"
                >
                    Katalog Vendor
                </Link>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <React.Fragment key={index}>
                            <span className="text-[#E8E2D7] select-none font-bold">/</span>
                            {isLast || !item.url ? (
                                <span className="font-bold text-[#2F3931] truncate max-w-xs sm:max-w-md">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.url}
                                    className="hover:text-[#2F3931] font-medium transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>

            {showBackButton && (
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#738075] hover:text-[#2F3931] px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D7] shadow-2xs transition-colors cursor-pointer"
                >
                    <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Kembali ke Katalog</span>
                </button>
            )}
        </div>
    );
}

