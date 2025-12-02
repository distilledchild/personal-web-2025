import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { loadLoopData, loadChromosomeData, loadGeneData, type LoopDataRow, type ChromosomeDataRow, type GeneDataRow } from '../utils/csvLoader';

interface HoverInfo {
    x: number;
    y: number;
    geneName: string;
    geneId: string;
    coordinates: string;
    geneCoordinates: string;
}

export const GenomeVisualization: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Visualization state
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [selectedGene, setSelectedGene] = useState<GeneDataRow | null>(null);

    // Data state
    const [selectedChr, setSelectedChr] = useState('chr12');
    const [loading, setLoading] = useState(true);
    const [allChromosomes, setAllChromosomes] = useState<ChromosomeDataRow[]>([]);
    const [allLoops, setAllLoops] = useState<LoopDataRow[]>([]);
    const [allGenes, setAllGenes] = useState<GeneDataRow[]>([]);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [chromosomes, loops, genes] = await Promise.all([
                    loadChromosomeData(),
                    loadLoopData(),
                    loadGeneData()
                ]);

                setAllChromosomes(chromosomes);
                setAllLoops(loops);
                setAllGenes(genes);

                console.log('Loaded data:', {
                    chromosomes: chromosomes.length,
                    loops: loops.length,
                    genes: genes.length
                });
            } catch (error) {
                console.error('Failed to load genome data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Get current chromosome data
    const chromosomeData = allChromosomes.find(c => c.chr === selectedChr) ||
        { chr: selectedChr, end: 100000000, start: 0 };

    // Filter data for selected chromosome
    const loopData = allLoops.filter(l => l.chr1 === selectedChr && l.chr2 === selectedChr);
    const geneData = allGenes.filter(g => g.chr === selectedChr);

    // Get gene coordinates from CSV data fields
    const parseGeneCoordinates = (gene: GeneDataRow) => {
        if (!gene.gene_start || !gene.gene_end) return null;

        return {
            start: gene.gene_start,
            end: gene.gene_end
        };
    };

    // Convert genomic coordinate to canvas x position
    const genomicToCanvas = (genomicPos: number, canvasWidth: number) => {
        const viewStart = offset / scale;
        const viewWidth = chromosomeData.end / scale;
        const relativePos = (genomicPos - viewStart) / viewWidth;
        return relativePos * canvasWidth;
    };

    // Convert canvas x position to genomic coordinate
    const canvasToGenomic = (canvasX: number, canvasWidth: number) => {
        const viewStart = offset / scale;
        const viewWidth = chromosomeData.end / scale;
        const relativePos = canvasX / canvasWidth;
        return viewStart + (relativePos * viewWidth);
    };

    // Draw the chromosome
    const drawChromosome = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const chromosomeY = height - 100;
        const chromosomeHeight = 30;

        // Draw chromosome background
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, chromosomeY, width, chromosomeHeight);

        // Draw chromosome border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, chromosomeY, width, chromosomeHeight);

        // Draw scale markers
        ctx.fillStyle = '#475569';
        ctx.font = '12px monospace';
        const viewStart = offset / scale;
        const viewWidth = chromosomeData.end / scale;
        const markerInterval = Math.pow(10, Math.floor(Math.log10(viewWidth / 10)));

        for (let pos = Math.floor(viewStart / markerInterval) * markerInterval;
            pos <= viewStart + viewWidth;
            pos += markerInterval) {
            const x = genomicToCanvas(pos, width);
            if (x >= 0 && x <= width) {
                ctx.beginPath();
                ctx.moveTo(x, chromosomeY);
                ctx.lineTo(x, chromosomeY - 10);
                ctx.stroke();

                ctx.fillText(
                    `${(pos / 1000000).toFixed(1)}Mb`,
                    x - 20,
                    chromosomeY - 15
                );
            }
        }

        // Draw chromosome label
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(chromosomeData.chr, 10, chromosomeY + chromosomeHeight / 2 + 5);
    };

    // Draw loops as parabolic arcs
    const drawLoops = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const chromosomeY = height - 100;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;

        loopData.forEach(loop => {
            const x1 = genomicToCanvas((loop.x1 + loop.x2) / 2, width);
            const x2 = genomicToCanvas((loop.y1 + loop.y2) / 2, width);

            if ((x1 >= 0 && x1 <= width) || (x2 >= 0 && x2 <= width)) {
                const arcHeight = Math.min(Math.abs(x2 - x1) * 0.3, 200);

                ctx.beginPath();
                ctx.moveTo(x1, chromosomeY);

                // Draw parabolic arc using quadratic curve
                const controlX = (x1 + x2) / 2;
                const controlY = chromosomeY - arcHeight;
                ctx.quadraticCurveTo(controlX, controlY, x2, chromosomeY);

                ctx.stroke();
            }
        });

        ctx.globalAlpha = 1;
    };

    // Draw TSS/Promoters and gene connections
    const drawGenes = (ctx: CanvasRenderingContext2D, width: number, height: number, mousePos: { x: number; y: number } | null) => {
        const chromosomeY = height - 100;
        const markerHeight = 40;

        geneData.forEach(gene => {
            const geneX = genomicToCanvas(gene.start, width);

            if (geneX >= 0 && geneX <= width) {
                // Determine color based on component type
                const color = gene.component === 'tss' ? '#ec4899' : '#8b5cf6';

                // Check if mouse is hovering over this gene
                const isHovering = mousePos &&
                    Math.abs(mousePos.x - geneX) < 5 &&
                    mousePos.y > chromosomeY - markerHeight - 10 &&
                    mousePos.y < chromosomeY + 30;

                // Draw marker line
                ctx.strokeStyle = color;
                ctx.lineWidth = isHovering ? 3 : 2;
                ctx.beginPath();
                ctx.moveTo(geneX, chromosomeY - markerHeight);
                ctx.lineTo(geneX, chromosomeY + 30);
                ctx.stroke();

                // Draw marker circle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(geneX, chromosomeY - markerHeight, isHovering ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();

                // If hovering or selected, draw connection to gene
                if (isHovering || (selectedGene && selectedGene.gene_id === gene.gene_id)) {
                    const geneCoords = parseGeneCoordinates(gene);
                    if (geneCoords) {
                        const geneMidX = genomicToCanvas((geneCoords.start + geneCoords.end) / 2, width);

                        // Draw parabolic connection
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.4;
                        ctx.setLineDash([5, 5]);

                        ctx.beginPath();
                        ctx.moveTo(geneX, chromosomeY - markerHeight);

                        const arcHeight = Math.min(Math.abs(geneMidX - geneX) * 0.2, 100);
                        const controlX = (geneX + geneMidX) / 2;
                        const controlY = chromosomeY - markerHeight - arcHeight;

                        ctx.quadraticCurveTo(controlX, controlY, geneMidX, chromosomeY - markerHeight);
                        ctx.stroke();

                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1;

                        // Draw gene marker
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        ctx.arc(geneMidX, chromosomeY - markerHeight, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }

                    // Show hover info
                    if (isHovering) {
                        const geneCoords = parseGeneCoordinates(gene);
                        setHoverInfo({
                            x: mousePos.x,
                            y: mousePos.y,
                            geneName: gene.gene_name,
                            geneId: gene.gene_id,
                            coordinates: `${gene.chr}:${gene.start.toLocaleString()}-${gene.end.toLocaleString()}`,
                            geneCoordinates: geneCoords
                                ? `${gene.gene_chr}:${geneCoords.start.toLocaleString()}-${geneCoords.end.toLocaleString()}`
                                : 'N/A'
                        });
                    }
                }
            }
        });
    };

    // Main draw function
    const draw = (mousePos: { x: number; y: number } | null = null) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw all elements
        drawChromosome(ctx, width, height);
        drawLoops(ctx, width, height);
        drawGenes(ctx, width, height, mousePos);
    };

    // Handle zoom
    const handleZoom = (delta: number, centerX?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const newScale = Math.max(1, Math.min(1000, scale * (1 + delta)));

        // Zoom towards center point if provided (for scroll zoom)
        if (centerX !== undefined) {
            const genomicCenter = canvasToGenomic(centerX, canvas.width);
            const newOffset = genomicCenter * newScale - centerX * (chromosomeData.end / canvas.width);
            setOffset(Math.max(0, Math.min(chromosomeData.end * (newScale - 1), newOffset)));
        }

        setScale(newScale);
    };

    // Handle mouse events
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, offset });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const genomicDx = (dx / canvas.width) * (chromosomeData.end / scale);
            const newOffset = Math.max(0, Math.min(
                chromosomeData.end * (scale - 1) / scale,
                dragStart.offset - genomicDx * scale
            ));
            setOffset(newOffset);
        } else {
            draw({ x: mouseX, y: mouseY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setHoverInfo(null);
        draw();
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta, mouseX);
    };

    const handleReset = () => {
        setScale(1);
        setOffset(0);
        setSelectedGene(null);
    };

    const handleChrChange = (chr: string) => {
        setSelectedChr(chr);
        setScale(1);
        setOffset(0);
        setSelectedGene(null);
    };

    // Redraw when state changes
    useEffect(() => {
        if (!loading) {
            draw();
        }
    }, [scale, offset, selectedGene, loading, selectedChr, allLoops, allGenes]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-lg text-slate-700 font-semibold mb-2">Loading genome data...</div>
                        <div className="text-sm text-slate-500">Please wait while we load chromosome, loop, and gene information</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">Genome Browser - {chromosomeData.chr}</h3>
                <p className="text-sm text-slate-600 mt-1">
                    Chromatin loops ({loopData.length}), TSS/Promoters ({geneData.length}), and gene locations
                </p>
            </div>

            {/* Controls */}
            <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-4 flex-wrap">
                {/* Chromosome Selector */}
                <select
                    value={selectedChr}
                    onChange={(e) => handleChrChange(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select chromosome"
                >
                    {allChromosomes.map(chr => (
                        <option key={chr.chr} value={chr.chr}>{chr.chr}</option>
                    ))}
                </select>

                <div className="border-l border-slate-300 h-8"></div>
                <button
                    onClick={() => handleZoom(0.2)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Zoom In"
                >
                    <ZoomIn size={18} />
                    Zoom In
                </button>
                <button
                    onClick={() => handleZoom(-0.2)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Zoom Out"
                >
                    <ZoomOut size={18} />
                    Zoom Out
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    title="Reset View"
                >
                    <RotateCcw size={18} />
                    Reset
                </button>
                <div className="ml-auto text-sm text-slate-600">
                    Scale: {scale.toFixed(1)}x
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    className="cursor-grab active:cursor-grabbing w-full h-full"
                />

                {/* Hover tooltip */}
                {hoverInfo && (
                    <div
                        className="absolute bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl pointer-events-none z-10 text-sm"
                        style={{
                            left: `${hoverInfo.x + 15}px`,
                            top: `${hoverInfo.y - 80}px`,
                            maxWidth: '300px'
                        }}
                    >
                        <div className="font-bold mb-1">{hoverInfo.geneName}</div>
                        <div className="text-slate-300 text-xs space-y-1">
                            <div>ID: {hoverInfo.geneId}</div>
                            <div>TSS/Pro: {hoverInfo.coordinates}</div>
                            <div>Gene: {hoverInfo.geneCoordinates}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                    <span className="text-slate-700">TSS</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="text-slate-700">Promoter</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-12 h-0.5 bg-blue-500"></div>
                    <span className="text-slate-700">Chromatin Loop</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-12 h-0.5 border-t-2 border-dashed border-slate-400"></div>
                    <span className="text-slate-700">TSS/Pro to Gene</span>
                </div>
            </div>
        </div>
    );
};
