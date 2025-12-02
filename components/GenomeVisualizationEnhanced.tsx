import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { loadChromosomeData, loadLoopDataForChr, loadGeneDataForChr, prefetchAllChromosomes, type LoopDataRow, type ChromosomeDataRow, type GeneDataRow } from '../utils/csvLoader';

interface HoverInfo {
    x: number;
    y: number;
    geneName: string;
    geneId: string;
    coordinates: string;
    component: string;
}

export const GenomeVisualizationEnhanced: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Visualization state
    const [scale, setScale] = useState(1.0);
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [selectedGene, setSelectedGene] = useState<GeneDataRow | null>(null);

    // Data loading state
    const [selectedChr, setSelectedChr] = useState('chr1');
    const [showLoops, setShowLoops] = useState(true);
    const [showTSS, setShowTSS] = useState(true);
    const [showPromoters, setShowPromoters] = useState(true);
    const [resizeTrigger, setResizeTrigger] = useState(0);
    const [loading, setLoading] = useState(true);

    // Data state
    const [allChromosomes, setAllChromosomes] = useState<ChromosomeDataRow[]>([]);
    const [allLoops, setAllLoops] = useState<LoopDataRow[]>([]);
    const [allGenes, setAllGenes] = useState<GeneDataRow[]>([]);

    // Load data on mount and when chromosome changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [chromosomes, loops, genes] = await Promise.all([
                    loadChromosomeData(),
                    loadLoopDataForChr(selectedChr),
                    loadGeneDataForChr(selectedChr)
                ]);

                setAllChromosomes(chromosomes);
                setAllLoops(loops);
                setAllGenes(genes);

                console.log(`Loaded data for ${selectedChr}: `, {
                    chromosomes: chromosomes.length,
                    loops: loops.length,
                    genes: genes.length
                });

                // After initial load, start prefetching other chromosomes in background
                if (chromosomes.length > 0) {
                    const otherChrs = chromosomes
                        .map(c => c.chr)
                        .filter(c => c !== selectedChr);

                    // Fire and forget - don't await
                    prefetchAllChromosomes(otherChrs);
                }
            } catch (error) {
                console.error('Failed to load genome data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedChr]);

    // Get current chromosome data
    const chromosomeData = allChromosomes.find(c => c.chr === selectedChr) ||
        { chr: selectedChr, end: 260522016, start: 0 };

    // Filter genes based on component type
    const geneData = allGenes.filter(g => {
        if (g.component === 'tss') return showTSS;
        if (g.component.includes('pro')) return showPromoters;
        return true;
    });

    // Filter loops (only show loops where both anchors are on the same chromosome)
    const loopData = showLoops ? allLoops.filter(l => l.chr1 === selectedChr && l.chr2 === selectedChr) : [];

    // Parse exon coordinates from the exon_id string
    const parseExonCoordinates = (gene: GeneDataRow) => {
        const exonId = gene.ensembl_exon_id || gene.refseq_exon_id;
        if (!exonId || exonId === 'NA') return null;

        const parts = exonId.split(':');
        if (parts.length < 3) return null;

        return {
            start: parseInt(parts[1]),
            end: parseInt(parts[2])
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
        const chromosomeY = height - 60;
        const chromosomeHeight = 30;

        // Draw chromosome background
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, chromosomeY, width, chromosomeHeight);

        // Draw chromosome border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, chromosomeY, width, chromosomeHeight);

        // Draw position markers
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';

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
                    `${(pos / 1000000).toFixed(1)} Mb`,
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
        const chromosomeY = height - 60;
        const markerHeight = 40;

        loopData.forEach(loop => {
            const x1 = genomicToCanvas((loop.x1 + loop.x2) / 2, width);
            const x2 = genomicToCanvas((loop.y1 + loop.y2) / 2, width);

            // console.log("Loop resolution raw value::::::::::::::::::::", loop.resolution);
            // console.log("Resolution after parsing::::::::::::::::::::", loop.resolution);

            // Check if loop is visible (overlaps with canvas width)
            // Even if anchors are off-screen, the arc might be crossing the screen
            // Add a buffer to prevent loops from disappearing abruptly when anchors are just off-screen
            const buffer = 200;
            if (Math.min(x1, x2) < width + buffer && Math.max(x1, x2) > -buffer) {
                // Color based on resolution (teal gradient matching legend)
                let loopColor = '#94a3b8'; // default gray
                const res = loop.resolution?.toString().trim().toUpperCase();

                if (res === '5') {
                    loopColor = '#0f766e'; // teal-700, #0d9488'; // teal-600
                } else if (res === '10') {
                    loopColor = '#14b8a6'; // teal-500
                } else if (res === '25') {
                    loopColor = '#99f6e4'; // teal-200, #5eead4// teal-300
                }
                // console.log("Assigned loopColor:::::::::::::::::::", loopColor);

                // Arc height is now 6x marker height (1.5x of previous 4x)
                const arcHeight = markerHeight * 6;

                // Draw parabolic arc
                ctx.strokeStyle = loopColor;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.moveTo(x1, chromosomeY);

                const controlX = (x1 + x2) / 2;
                const controlY = chromosomeY - arcHeight;
                ctx.quadraticCurveTo(controlX, controlY, x2, chromosomeY);

                ctx.stroke();
                ctx.globalAlpha = 1;

                // Draw anchor circles at loop ends
                const anchorRadius = 4;
                ctx.fillStyle = loopColor;

                // Left anchor
                ctx.beginPath();
                ctx.arc(x1, chromosomeY, anchorRadius, 0, Math.PI * 2);
                ctx.fill();

                // Right anchor
                ctx.beginPath();
                ctx.arc(x2, chromosomeY, anchorRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    // Draw TSS/Promoters and gene connections
    const drawGenes = (ctx: CanvasRenderingContext2D, width: number, height: number, mousePos: { x: number; y: number } | null) => {
        const chromosomeY = height - 60;
        const markerHeight = 40;
        let anyHovered = false;

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

                if (isHovering) anyHovered = true;

                // Draw marker line (matchstick style)
                ctx.strokeStyle = color;
                ctx.lineWidth = isHovering ? 3 : 2;
                ctx.beginPath();
                ctx.moveTo(geneX, chromosomeY - markerHeight);
                ctx.lineTo(geneX, chromosomeY + 30);
                ctx.stroke();

                // Draw marker circle head
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(geneX, chromosomeY - markerHeight, isHovering ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();

                // Check if gene info exists (gene_chr, gene_start, gene_end)
                const hasGeneInfo = gene.gene_chr && gene.gene_start && gene.gene_end &&
                    gene.gene_start !== gene.start; // Make sure it's different from TSS/Promoter

                // Draw connection to gene if gene info exists
                if (hasGeneInfo) {
                    const geneMidX = genomicToCanvas((gene.gene_start + gene.gene_end) / 2, width);

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

                    // Draw gene marker (different shape - diamond/rhombus)
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.5;
                    const geneMarkerSize = 6;

                    // Draw diamond shape
                    ctx.beginPath();
                    ctx.moveTo(geneMidX, chromosomeY - markerHeight - geneMarkerSize); // top
                    ctx.lineTo(geneMidX + geneMarkerSize, chromosomeY - markerHeight); // right
                    ctx.lineTo(geneMidX, chromosomeY - markerHeight + geneMarkerSize); // bottom
                    ctx.lineTo(geneMidX - geneMarkerSize, chromosomeY - markerHeight); // left
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                // Show hover info
                if (isHovering && mousePos) {
                    // Parse gene_id to get 4th and 5th elements
                    const geneIdParts = gene.gene_id.split(':');
                    const element4 = geneIdParts[3] || 'N/A';  // 4th element (index 3)
                    const element5 = geneIdParts[4] || 'N/A';  // 5th element (index 4)

                    setHoverInfo({
                        x: mousePos.x,
                        y: mousePos.y,
                        geneName: element4,
                        geneId: element5,
                        coordinates: `${gene.chr}:${gene.start}-${gene.end}`,
                        component: gene.component
                    });
                }
            }
        });

        if (mousePos && !anyHovered) {
            setHoverInfo(null);
        }
    };

    // Draw the overview bar (minimap)
    const drawOverview = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const overviewHeight = 15; // Half of main bar height (30)
        // Place it between main bar (ends at height-30) and bottom (height)
        // Main bar is at height-60 to height-30.
        // We have 30px space below. Let's center it roughly.
        const overviewY = height - 22;

        // Draw overview background (same color as main bar)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, overviewY, width, overviewHeight);

        // Draw overview border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, overviewY, width, overviewHeight);

        // Draw viewport rectangle
        // Calculate visible range in genomic coordinates
        const viewStart = offset / scale;
        const viewWidth = chromosomeData.end / scale;
        const viewEnd = viewStart + viewWidth;

        // Map to canvas coordinates on the overview bar (which is 1x scale, full width)
        // overviewX = (genomicPos / chromosomeData.end) * width
        // Ensure we don't divide by zero
        const totalLength = chromosomeData.end || 1;

        const x1 = (viewStart / totalLength) * width;
        const x2 = (viewEnd / totalLength) * width;
        // Clamp to canvas bounds for safety
        const rectX = Math.max(0, x1);
        const rectW = Math.min(width, x2) - rectX;

        // Draw the viewport indicator
        // User requested a rectangle marking the left and right coordinates
        ctx.strokeStyle = '#60a5fa'; // Lighter blue (blue-400) // ctx.strokeStyle = '#14b8a6'; // Teal (teal-500)
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, overviewY, rectW, overviewHeight);

        // Add a semi-transparent fill to highlight the active area
        ctx.fillStyle = 'rgba(96, 165, 250, 0.2)'; // ctx.fillStyle = 'rgba(20, 184, 166, 0.2)';
        ctx.fillRect(rectX, overviewY, rectW, overviewHeight);
    };

    // Main draw function
    const draw = (mousePos: { x: number; y: number } | null = null) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate dimensions accounting for padding
        const style = window.getComputedStyle(container);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const paddingTop = parseFloat(style.paddingTop);
        const paddingBottom = parseFloat(style.paddingBottom);

        const width = container.clientWidth - paddingLeft - paddingRight;
        const height = container.clientHeight - paddingTop - paddingBottom;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw all elements
        drawChromosome(ctx, width, height);
        drawOverview(ctx, width, height); // Add overview bar
        if (showLoops) drawLoops(ctx, width, height);
        if (showTSS || showPromoters) drawGenes(ctx, width, height, mousePos);
    };

    // Handle zoom
    const handleZoom = (delta: number, centerX?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Clamp minimum scale to 1.0 to prevent zooming out beyond full chromosome view
        const newScale = Math.max(1.0, Math.min(1000, scale * (1 + delta)));

        // Zoom towards center point if provided (for scroll zoom)
        if (centerX !== undefined) {
            const genomicCenter = canvasToGenomic(centerX, canvas.width);
            const newOffset = genomicCenter * newScale - centerX * (chromosomeData.end / canvas.width);
            setOffset(Math.max(0, Math.min(chromosomeData.end * (newScale - 1), newOffset)));
        }

        setScale(newScale);
    };

    // Handle wheel event (zoom) with non-passive listener to prevent page scroll
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            handleZoom(delta, mouseX);
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', onWheel);
        };
    }, [scale, offset, chromosomeData]); // Re-bind if dependencies change, or use refs for state

    // Refs for drag state and current values to avoid closure staleness in event listeners
    const dragInfoRef = useRef({ startX: 0, startOffset: 0 });
    const stateRef = useRef({ scale, chromosomeData });

    // Update state ref whenever relevant state changes
    useEffect(() => {
        stateRef.current = { scale, chromosomeData };
    }, [scale, chromosomeData]);

    // Handle global mouse events for dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const { scale, chromosomeData } = stateRef.current;
            const dx = e.clientX - dragInfoRef.current.startX;

            // Calculate new offset based on drag distance
            // genomicDx * scale = (dx / width) * chromosomeData.end
            const offsetChange = (dx / canvas.width) * chromosomeData.end;
            let newOffset = dragInfoRef.current.startOffset - offsetChange;

            // Clamp offset
            const maxOffset = Math.max(0, chromosomeData.end * (scale - 1));
            newOffset = Math.max(0, Math.min(maxOffset, newOffset));

            setOffset(newOffset);
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    // Handle mouse events
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        dragInfoRef.current = {
            startX: e.clientX,
            startOffset: offset
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Only handle hover effects here. Dragging is handled by global listener.
        if (!isDragging) {
            draw({ x: mouseX, y: mouseY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        // Do NOT stop dragging here. Dragging should continue even if mouse leaves canvas.
        setHoverInfo(null);
        draw();
    };

    // Removed handleWheel from here as it's now handled by the effect

    const handleReset = () => {
        setScale(1.0);
        setOffset(0);
        setSelectedGene(null);
    };

    const handleChrChange = (chr: string) => {
        setSelectedChr(chr);
        setScale(1.0);
        setOffset(0);
        setSelectedGene(null);
    };

    // Handle resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            setResizeTrigger(prev => prev + 1);
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Redraw when state changes
    useEffect(() => {
        draw();
    }, [scale, offset, selectedGene, selectedChr, showLoops, showTSS, showPromoters, resizeTrigger]);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">


            {/* Controls */}
            <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-4 flex-wrap bg-slate-50 flex-shrink-0">
                {/* Chromosome Selector */}
                <select
                    value={selectedChr}
                    onChange={(e) => handleChrChange(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select chromosome"
                    disabled={loading}
                >
                    {allChromosomes.length > 0 ? (
                        allChromosomes.map(chr => (
                            <option key={chr.chr} value={chr.chr}>{chr.chr}</option>
                        ))
                    ) : (
                        <option value={selectedChr}>{selectedChr} (Loading...)</option>
                    )}
                </select>

                {/* Feature Toggles */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showLoops}
                        onChange={(e) => setShowLoops(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Loops</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showTSS}
                        onChange={(e) => setShowTSS(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">TSS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showPromoters}
                        onChange={(e) => setShowPromoters(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Promoters</span>
                </label>

                <div className="border-l border-slate-300 h-8 mx-2"></div>

                {/* Zoom Controls */}
                <button
                    onClick={() => {
                        if (canvasRef.current) {
                            handleZoom(0.2, canvasRef.current.width / 2);
                        }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Zoom In"
                >
                    <ZoomIn size={18} />
                    Zoom In
                </button>
                <button
                    onClick={() => {
                        if (canvasRef.current) {
                            handleZoom(-0.2, canvasRef.current.width / 2);
                        }
                    }}
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
            <div className="flex-1 relative p-6 overflow-hidden" ref={containerRef}>
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <div className="text-slate-600 font-medium">Loading genome data for {selectedChr}...</div>
                    </div>
                ) : (
                    <>
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            className="cursor-grab active:cursor-grabbing w-full h-full"
                        />

                        {/* Top-left legend - Component types */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs">
                            <div className="font-bold text-slate-700 mb-2">Components</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                    <span className="text-slate-600">TSS</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                    <span className="text-slate-600">Promoter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-pink-500" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                                    <span className="text-slate-600">TSS Gene</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-purple-600" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                                    <span className="text-slate-600">Promoter Gene</span>
                                </div>
                            </div>
                        </div>

                        {/* Right-side legend - Loop resolutions */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs">
                            <div className="font-bold text-slate-700 mb-2">Loop Resolution</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-0.5 bg-teal-600"></div>
                                    <span className="text-slate-600">5K</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-0.5 bg-teal-500"></div>
                                    <span className="text-slate-600">10K</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-0.5 bg-teal-300"></div>
                                    <span className="text-slate-600">25K</span>
                                </div>
                            </div>
                        </div>

                        {/* Hover tooltip */}
                        {hoverInfo && (
                            <div
                                className={`absolute px-4 py-3 rounded-lg shadow-xl pointer-events-none z-10 text-sm max-w-xs backdrop-blur-sm border ${hoverInfo.component === 'tss'
                                    ? 'bg-pink-50/75 border-pink-200 text-pink-900'
                                    : 'bg-purple-50/75 border-purple-200 text-purple-900'
                                    }`}
                                style={{
                                    left: `${hoverInfo.x + 15}px`,
                                    top: `${hoverInfo.y - 80}px`
                                }}
                            >
                                <div className="font-bold mb-1">{hoverInfo.geneName}</div>
                                <div className={`text-xs space-y-1 ${hoverInfo.component === 'tss' ? 'text-pink-800' : 'text-purple-800'
                                    }`}>
                                    <div>{hoverInfo.geneId}</div>
                                    <div>Position: {hoverInfo.coordinates}</div>
                                    <div>Type: {hoverInfo.component === 'tss' ? 'TSS' : 'Promoter'}</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};
