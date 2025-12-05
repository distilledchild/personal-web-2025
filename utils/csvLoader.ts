// Utility functions to load and parse CSV data
import { getSignedUrl } from './signedUrlHelper';

// Wrapper function for research category
async function getResearchSignedUrl(fileName: string): Promise<string> {
    return getSignedUrl('research', fileName);
}

export interface LoopDataRow {
    loop_id: string;
    chr1: string;
    x1: number;
    x2: number;
    chr2: string;
    y1: number;
    y2: number;
    end_distance?: number;
    distance?: number;
    resolution?: string;
    x0?: number;
    x3?: number;
    y0?: number;
    y3?: number;
    chr_end_coord?: number;
    start?: number;
}

export interface ChromosomeDataRow {
    chr: string;
    end: number;
    start: number;
}

export interface GeneDataRow {
    chr: string;
    start: number;
    end: number;
    gene_id: string;
    gene_name: string;
    component_id: string;
    ensembl_exon_id: string;
    refseq_exon_id: string;
    component: string;
    gene_chr: string;
    gene_start: number;
    gene_end: number;
    gene_strand: string;
}

// Cache for loaded data
const dataCache: {
    loops: { [key: string]: LoopDataRow[] };
    genes: { [key: string]: GeneDataRow[] };
    chromosomes: ChromosomeDataRow[] | null;
} = {
    loops: {},
    genes: {},
    chromosomes: null
};

// Parse CSV text to array of objects
function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};

        headers.forEach((header, index) => {
            const value = values[index];
            // Try to parse as number if possible
            const numValue = parseFloat(value);
            row[header] = isNaN(numValue) ? value : numValue;
        });

        rows.push(row);
    }

    return rows;
}

// Load loop data from CSV
export async function loadLoopData(): Promise<LoopDataRow[]> {
    if (dataCache.loops['all']) return dataCache.loops['all'];

    try {
        const url = await getResearchSignedUrl('loop_data.csv');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load loop data');

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const data = rows.map(row => ({
            loop_id: row.loop_id || row['loop.id'] || '',
            chr1: row.chr1,
            x1: Number(row.x1),
            x2: Number(row.x2),
            chr2: row.chr2,
            y1: Number(row.y1),
            y2: Number(row.y2),
            end_distance: row.end_distance || row['end.distance'],
            distance: row.distance,
            resolution: row.resolution,
            x0: row.x0,
            x3: row.x3,
            y0: row.y0,
            y3: row.y3,
            chr_end_coord: row.chr_end_coord || row['chr.end.coord'],
            start: row.start
        }));

        dataCache.loops['all'] = data;
        return data;
    } catch (error) {
        console.error('Error loading loop data:', error);
        return [];
    }
}

// Load chromosome data from CSV
export async function loadChromosomeData(): Promise<ChromosomeDataRow[]> {
    if (dataCache.chromosomes) return dataCache.chromosomes;

    try {
        const url = await getResearchSignedUrl('chromosome_data.csv');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load chromosome data');

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const data = rows.map(row => ({
            chr: row.chr,
            end: Number(row.end),
            start: Number(row.start)
        }));

        dataCache.chromosomes = data;
        return data;
    } catch (error) {
        console.error('Error loading chromosome data:', error);
        return [];
    }
}

// Load gene TSS/promoter data from CSV
export async function loadGeneData(): Promise<GeneDataRow[]> {
    if (dataCache.genes['all']) return dataCache.genes['all'];

    try {
        const url = await getResearchSignedUrl('gene_tss_and_pro.csv');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load gene data');

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const data = rows.map(row => ({
            chr: row.chr,
            start: Number(row.start),
            end: Number(row.end),
            gene_id: row.gene_id || row['gene.id'] || '',
            gene_name: row.gene_name || row['gene.name'] || '',
            component_id: row.component_id || row['component.id'] || '',
            ensembl_exon_id: row.ensembl_exon_id || row['ensembl.exon.id'] || '',
            refseq_exon_id: row.refseq_exon_id || row['refseq.exon.id'] || '',
            component: row.component,
            gene_chr: row.gene_chr || row['gene.chr'] || row.chr,
            gene_start: Number(row.gene_start || row['gene.start'] || row.start),
            gene_end: Number(row.gene_end || row['gene.end'] || row.end),
            gene_strand: row.gene_strand || row['gene.strand'] || ''
        }));

        dataCache.genes['all'] = data;
        return data;
    } catch (error) {
        console.error('Error loading gene data:', error);
        return [];
    }
}

// Load loop data for a specific chromosome
export async function loadLoopDataForChr(chr: string): Promise<LoopDataRow[]> {
    if (dataCache.loops[chr]) return dataCache.loops[chr];

    try {
        const url = await getResearchSignedUrl(`loop_data_${chr}.csv`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load loop data for ${chr}`);

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const data = rows.map(row => ({
            loop_id: row.loop_id || row['loop.id'] || '',
            chr1: row.chr1,
            x1: Number(row.x1),
            x2: Number(row.x2),
            chr2: row.chr2,
            y1: Number(row.y1),
            y2: Number(row.y2),
            end_distance: row.end_distance || row['end.distance'],
            distance: row.distance,
            resolution: row.resolution,
            x0: row.x0,
            x3: row.x3,
            y0: row.y0,
            y3: row.y3,
            chr_end_coord: row.chr_end_coord || row['chr.end.coord'],
            start: row.start
        }));

        dataCache.loops[chr] = data;
        return data;
    } catch (error) {
        console.error(`Error loading loop data for ${chr}:`, error);
        return [];
    }
}

// Load gene TSS/promoter data for a specific chromosome
export async function loadGeneDataForChr(chr: string): Promise<GeneDataRow[]> {
    if (dataCache.genes[chr]) return dataCache.genes[chr];

    try {
        const url = await getResearchSignedUrl(`gene_tss_and_pro_${chr}.csv`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load gene data for ${chr}`);

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const data = rows.map(row => ({
            chr: row.chr,
            start: Number(row.start),
            end: Number(row.end),
            gene_id: row.gene_id || row['gene.id'] || '',
            gene_name: row.gene_name || row['gene.name'] || '',
            component_id: row.component_id || row['component.id'] || '',
            ensembl_exon_id: row.ensembl_exon_id || row['ensembl.exon.id'] || '',
            refseq_exon_id: row.refseq_exon_id || row['refseq.exon.id'] || '',
            component: row.component,
            gene_chr: row.gene_chr || row['gene.chr'] || '',
            gene_start: Number(row.gene_start || row['gene.start'] || 0),
            gene_end: Number(row.gene_end || row['gene.end'] || 0),
            gene_strand: row.gene_strand || row['gene.strand'] || ''
        }));

        dataCache.genes[chr] = data;
        return data;
    } catch (error) {
        console.error(`Error loading gene data for ${chr}:`, error);
        return [];
    }
}

// Prefetch all chromosomes in background
export async function prefetchAllChromosomes(chromosomes: string[]) {
    for (const chr of chromosomes) {
        // Skip if already cached
        if (dataCache.loops[chr] && dataCache.genes[chr]) continue;

        // Load in background with low priority
        try {
            await Promise.all([
                loadLoopDataForChr(chr),
                loadGeneDataForChr(chr)
            ]);
            console.log(`Prefetched data for ${chr}`);
        } catch (e) {
            console.warn(`Failed to prefetch ${chr}`, e);
        }

        // Small delay to yield to main thread
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
