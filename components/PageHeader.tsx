import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
    label: string;
    path?: string; // If using navigation
    id?: string;   // If using local state
    icon?: LucideIcon;
    slug?: string; // For compatibility with existing Research tabs
    color?: string; // For compatibility with existing Research tabs
}

interface PageHeaderProps {
    title: string;
    tabs: TabItem[];
    activeTab: string | number;
    onTabChange: (tabId: any) => void;
    className?: string;
    activeColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    tabs,
    activeTab,
    onTabChange,
    className = '',
    activeColor = 'border-slate-800 text-slate-800'
}) => {
    return (
        <div className={`pt-32 pb-8 px-6 bg-white flex-shrink-0 ${className}`}>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-bold text-slate-900 mb-6 text-center">
                    {title}
                </h2>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {tabs.map((tab, idx) => {
                        // Determine if this tab is active
                        const isActive = (tab.id === activeTab) || (tab.path === activeTab) || (tab.slug === activeTab) || (idx === activeTab);

                        // Determine colors
                        let activeClasses = activeColor;
                        if (tab.color && isActive) {
                            activeClasses = tab.color;
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => onTabChange(tab.id || tab.path || tab.slug || idx)}
                                className={`
                                    flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                    ${isActive
                                        ? activeClasses
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                                `}
                            >
                                {tab.icon && <tab.icon size={20} />}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                <hr className="border-slate-100" />
            </div>
        </div>
    );
};
