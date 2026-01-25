import React, { ReactNode } from 'react';
import { PageHeader, TabItem } from './PageHeader';

interface BlogLayoutProps {
    title: string;
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    sidebar: ReactNode;
    children: ReactNode;
}

export const BlogLayout: React.FC<BlogLayoutProps> = ({
    title,
    tabs,
    activeTab,
    onTabChange,
    sidebar,
    children
}) => {
    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            <PageHeader
                title={title}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={onTabChange}
                activeColor="border-pink-500 text-pink-500"
            />

            <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0 px-6 pb-4">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 overflow-y-auto scrollbar-hide lg:overflow-hidden">
                            {/* Sidebar TOC */}
                            <div className="lg:w-64 flex-shrink-0 space-y-3 lg:overflow-y-auto scrollbar-hide pr-2 pb-20 lg:pb-0">
                                {sidebar}
                            </div>
                            
                            {/* Main Content */}
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide lg:overflow-hidden">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
