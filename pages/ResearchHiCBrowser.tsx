import React from 'react';
import { JuiceboxBrowser } from '../components/JuiceboxBrowser';

export const ResearchHiCBrowser: React.FC = () => {
    // Start with null to prevent loading errors for non-existent default files
    const [hicFile, setHicFile] = React.useState<File | string | null>(null);
    const [extraTracks, setExtraTracks] = React.useState<any[]>([]);

    // Check if we are in development mode
    const isDev = import.meta.env.DEV;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hic' | 'ctcf' | 'gtf') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'hic') {
            setHicFile(file);
        } else {
            const newTrack = {
                type: type === 'ctcf' ? 'wig' : 'annotation',
                format: type === 'ctcf' ? 'bigwig' : 'gtf',
                url: file,
                name: file.name,
                height: 100
            };
            setExtraTracks(prev => [...prev, newTrack]);
        }
    };

    const loadSampleFromServer = async () => {
        try {
            const fileName = 'DA68A_intact_inter_30.hic';
            const res = await fetch(`/api/research/hic-data?fileName=${encodeURIComponent(fileName)}`);
            if (!res.ok) throw new Error(`Failed to fetch signed URL (${res.status})`);
            const json = await res.json();
            if (!json?.url) throw new Error('Response missing url');
            setHicFile(json.url);
        } catch (e) {
            console.error('[hicbrowser] sample load failed:', e);
            // Fallback: public sample that supports Range requests (useful for local/dev validation).
            setHicFile('https://hicfiles.s3.amazonaws.com/hiseq/rpe1/DarrowHuntley-2015/WT-chrX-diploid.hic');
        }
    };

    return (
        <div className='animate-fadeIn pb-2 space-y-4'> {/* Minimized padding */}
            <div className="mb-1">
                <p className='text-slate-500 text-base'>
                    Interactive Hi-C contact matrix visualization. Upload your data below to begin.
                </p>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 text-sm font-bold">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        데이터 업로드
                    </div>
                    {isDev ? (
                        <button
                            onClick={loadSampleFromServer}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 underline"
                        >
                            서버 샘플 로드 시도
                        </button>
                    ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white/80 rounded-lg border border-indigo-50 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hi-C Matrix (.hic)</label>
                        <input
                            type="file"
                            accept=".hic"
                            onChange={(e) => handleFileChange(e, 'hic')}
                            className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                        />
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-indigo-50 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CTCF Track (.bw)</label>
                        <input
                            type="file"
                            accept=".bw,.bigwig"
                            onChange={(e) => handleFileChange(e, 'ctcf')}
                            className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-700 cursor-pointer"
                        />
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-indigo-50 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Annotation (.gtf)</label>
                        <input
                            type="file"
                            accept=".gtf,.bed"
                            onChange={(e) => handleFileChange(e, 'gtf')}
                            className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-700 cursor-pointer"
                        />
                    </div>
                </div>
                <div className="text-[11px] text-slate-500">
                    참고: .hic는 브라우저에서 부분 읽기(random access)가 필요해서, 로컬 파일 또는 Range 요청을 지원하는 URL이어야 합니다.
                </div>
            </div>

            <div className="min-h-[550px]">
                <JuiceboxBrowser hicUrl={hicFile} locus="chr1:1-100,000,000" tracks={extraTracks} height={560} />
            </div>
        </div>
    );
};
