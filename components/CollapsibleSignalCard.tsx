import React, { useState } from 'react';

interface CollapsibleSignalCardProps {
    title: string;
    subtitle?: string;
    value?: React.ReactNode;
    unit?: React.ReactNode;
    badge?: React.ReactNode;
    meta?: React.ReactNode;
    error?: React.ReactNode;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

const CollapsibleSignalCard: React.FC<CollapsibleSignalCardProps> = ({
    title,
    subtitle,
    value,
    unit,
    badge,
    meta,
    error,
    children,
    defaultExpanded = false,
    className = '',
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className={`self-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
            <button
                type="button"
                onClick={() => setExpanded(current => !current)}
                aria-expanded={expanded}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline gap-2">
                        <h4 className="truncate text-[15px] font-black text-slate-800">{title}</h4>
                        {subtitle && expanded && (
                            <span className="shrink-0 font-mono text-[10px] font-bold text-slate-400">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>

                {value !== undefined && (
                    <div className="hidden shrink-0 items-baseline gap-1 sm:flex">
                        <span className="font-mono text-[15px] font-black text-slate-900">{value}</span>
                        {unit && <span className="text-[10px] font-black text-slate-400">{unit}</span>}
                    </div>
                )}

                {badge && (
                    <div className="hidden shrink-0 rounded-lg bg-gradient-to-br from-[#FFA300] via-[#FF7700] to-[#FF5500] px-2.5 py-1 text-[11px] font-black text-white shadow-sm md:block">
                        {badge}
                    </div>
                )}

                <span
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                >
                    <span className="block h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-slate-500" />
                </span>
            </button>

            {expanded && (
                <div className="border-t border-slate-100 px-4 pb-3 pt-3">
                    {error ? (
                        <div className="py-4 text-center">
                            <p className="text-sm font-medium text-red-500">{error}</p>
                        </div>
                    ) : (
                        <>
                            {(value !== undefined || badge || meta) && (
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    {value !== undefined ? (
                                        <div className="min-w-0">
                                            <span className="font-mono text-2xl font-black tracking-tight text-slate-900">
                                                {value}
                                            </span>
                                            {unit && (
                                                <span className="ml-1 text-sm font-bold text-slate-400">
                                                    {unit}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span />
                                    )}
                                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                                        {badge && (
                                            <div className="rounded-lg bg-gradient-to-br from-[#FFA300] via-[#FF7700] to-[#FF5500] px-3 py-1.5 text-[13px] font-bold text-white shadow-md">
                                                {badge}
                                            </div>
                                        )}
                                        {meta && (
                                            <span className="font-mono text-[9px] text-slate-400">{meta}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {children}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSignalCard;
