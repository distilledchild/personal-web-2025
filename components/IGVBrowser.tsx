import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        igv: any;
    }
}

interface IGVBrowserProps {
    hicUrl: string | File | null;
    genome?: string;
    locus?: string;
    extraTracks?: any[];
}

export const IGVBrowser: React.FC<IGVBrowserProps> = ({
    hicUrl,
    genome = 'rn7',
    locus = 'chr1:1-100,000,000',
    extraTracks = []
}) => {
    const igvContainer = useRef<HTMLDivElement>(null);
    const isInitializing = useRef(false);

    useEffect(() => {
        if (!igvContainer.current || !hicUrl) {
            // URL이 없으면 캔버스 비우고 대기
            if (igvContainer.current) igvContainer.current.innerHTML = '';
            if (window.igv) window.igv.removeAllBrowsers();
            return;
        }

        const initializeIGV = async () => {
            if (isInitializing.current) return;
            isInitializing.current = true;

            try {
                if (window.igv) window.igv.removeAllBrowsers();
                if (igvContainer.current) igvContainer.current.innerHTML = '';

                const tracks = [
                    {
                        type: 'hic',
                        format: 'hic',
                        url: hicUrl,
                        name: hicUrl instanceof File ? hicUrl.name : 'Hi-C Heatmap',
                        height: 500,
                        displayMode: 'TRIANGULAR',
                        colorScale: 'Greens',
                        // 파일 객체인 경우 IGV가 내부적으로 Blob URL을 생성함
                    },
                    ...extraTracks
                ];

                const igvOptions = {
                    genome: genome,
                    locus: locus,
                    tracks: tracks
                };

                // 초기화 전 마지막 체크
                await window.igv.createBrowser(igvContainer.current, igvOptions);
            } catch (error) {
                console.error("IGV initialization failed:", error);
            } finally {
                isInitializing.current = false;
            }
        };

        initializeIGV();

        return () => {
            if (window.igv) window.igv.removeAllBrowsers();
            if (igvContainer.current) igvContainer.current.innerHTML = '';
            isInitializing.current = false;
        };
    }, [hicUrl, genome, locus, extraTracks]);

    if (!hicUrl) {
        return (
            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400">
                <p className="text-lg font-medium">데이터 로딩 대기 중...</p>
                <p className="text-sm">상단 패널에서 .hic 파일을 업로드해 주세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Hi-C Contact Matrix</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                    Reference: {genome}
                </span>
            </div>
            <div
                ref={igvContainer}
                className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
                style={{ minHeight: '520px' }}
            />
        </div>
    );
};
