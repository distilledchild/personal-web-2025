# Genome Visualization - Data Integration Guide

## Overview
The genome visualization component displays chromatin loops, TSS/promoters, and gene exon locations on an interactive chromosome browser.

## How to Use Your Own Data

### Step 1: Prepare Your Data Files

You have three datasets:

1. **Gene TSS and Promoter Data** (`df.gene_tss_and_pro`)
2. **Chromatin Loop Data** (`df.DISTINCT.loop.deep.sample.all.lt.2mb.prep`)
3. **Chromosome Length Data** (`chromosome_data`)

### Step 2: Export Data from R to JSON

In your R environment, export the data to JSON format:

```r
# Install jsonlite if not already installed
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

# Export gene TSS/promoter data
gene_data_json <- df.gene_tss_and_pro %>%
  select(chr, start, end, gene_id, gene_name, component_id, 
         ensembl_exon_id, refseq_exon_id, component) %>%
  toJSON(pretty = TRUE)

write(gene_data_json, "gene_data.json")

# Export loop data
loop_data_json <- df.DISTINCT.loop.deep.sample.all.lt.2mb.prep %>%
  select(loop_id, chr1, x1, x2, chr2, y1, y2) %>%
  toJSON(pretty = TRUE)

write(loop_data_json, "loop_data.json")

# Export chromosome data
chrom_data_json <- chromosome_data %>%
  filter(chr == "chr12") %>%  # or whichever chromosome you want
  toJSON(pretty = TRUE)

write(chrom_data_json, "chromosome_data.json")
```

### Step 3: Create API Endpoints (Optional - for Large Datasets)

For large datasets, create backend API endpoints in `server/index.js`:

```javascript
// Add these routes to your server/index.js

app.get('/api/genome/genes/:chr', async (req, res) => {
  try {
    const { chr } = req.params;
    // Read from your JSON file or database
    const geneData = require('./data/gene_data.json').filter(g => g.chr === chr);
    res.json(geneData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/genome/loops/:chr', async (req, res) => {
  try {
    const { chr } = req.params;
    const loopData = require('./data/loop_data.json').filter(l => l.chr1 === chr);
    res.json(loopData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/genome/chromosome/:chr', async (req, res) => {
  try {
    const { chr } = req.params;
    const chromData = require('./data/chromosome_data.json').find(c => c.chr === chr);
    res.json(chromData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 4: Update the GenomeVisualization Component

Modify `/components/GenomeVisualization.tsx` to load your data:

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const GenomeVisualization: React.FC = () => {
  const [geneData, setGeneData] = useState<GeneData[]>([]);
  const [loopData, setLoopData] = useState<LoopData[]>([]);
  const [chromosomeData, setChromosomeData] = useState<ChromosomeData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : 'https://your-production-url.com';
        
        const chr = 'chr12'; // Change this to allow user selection
        
        // Fetch all data
        const [genes, loops, chrom] = await Promise.all([
          fetch(`${API_URL}/api/genome/genes/${chr}`).then(r => r.json()),
          fetch(`${API_URL}/api/genome/loops/${chr}`).then(r => r.json()),
          fetch(`${API_URL}/api/genome/chromosome/${chr}`).then(r => r.json())
        ]);
        
        setGeneData(genes);
        setLoopData(loops);
        setChromosomeData(chrom);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load genome data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading genome data...</div>;
  }
  
  // ... rest of the component code
};
```

### Step 5: Direct Data Import (For Smaller Datasets)

For smaller datasets, you can import the JSON directly:

1. Place your JSON files in `/public/data/`:
   - `/public/data/gene_data.json`
   - `/public/data/loop_data.json`
   - `/public/data/chromosome_data.json`

2. Update the component to fetch from public folder:

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const [genes, loops, chrom] = await Promise.all([
        fetch('/data/gene_data.json').then(r => r.json()),
        fetch('/data/loop_data.json').then(r => r.json()),
        fetch('/data/chromosome_data.json').then(r => r.json())
      ]);
      
      // Filter for chr12 if needed
      setGeneData(genes.filter(g => g.chr === 'chr12'));
      setLoopData(loops.filter(l => l.chr1 === 'chr12'));
      setChromosomeData(chrom.find(c => c.chr === 'chr12'));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load genome data:', error);
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

## Data Format Requirements

### Gene Data Format
```json
[
  {
    "chr": "chr12",
    "start": 25000000,
    "end": 25000002,
    "gene_id": "ENSRNOG00000000001",
    "gene_name": "Gene1",
    "component_id": "chr12:25000000:25000002:+:ENSRNOG00000000001:Gene1|tss",
    "ensembl_exon_id": "chr12:25500000:25505000:Gene1:ENSRNOG00000000001:1",
    "refseq_exon_id": "NA",
    "component": "tss"
  }
]
```

### Loop Data Format
```json
[
  {
    "loop_id": "chr12_20000000_20500000_chr12_30000000_30500000_25000",
    "chr1": "chr12",
    "x1": 20000000,
    "x2": 20500000,
    "chr2": "chr12",
    "y1": 30000000,
    "y2": 30500000
  }
]
```

### Chromosome Data Format
```json
[
  {
    "chr": "chr12",
    "end": 120000000,
    "start": 0
  }
]
```

## Features

- **Zoom In/Out**: Use buttons or mouse wheel to zoom
- **Pan**: Click and drag to pan along the chromosome
- **Hover Info**: Hover over TSS/promoter markers to see gene details
- **Loops**: Chromatin loops shown as blue parabolic arcs
- **Gene Connections**: Dashed lines connect TSS/promoters to their corresponding exons on hover

## Customization

### Change Chromosome

Add a dropdown selector to switch between chromosomes:

```typescript
const [selectedChr, setSelectedChr] = useState('chr12');

// In your JSX
<select 
  value={selectedChr} 
  onChange={(e) => setSelectedChr(e.target.value)}
  className="px-4 py-2 border rounded"
>
  <option value="chr1">Chromosome 1</option>
  <option value="chr2">Chromosome 2</option>
  {/* ... more chromosomes */}
</select>
```

### Adjust Colors

Colors are defined in the `drawGenes` and `drawLoops` functions:

```typescript
// TSS color
const color = gene.component === 'tss' ? '#ec4899' : '#8b5cf6';

// Loop color
ctx.strokeStyle = '#3b82f6';
```

### Modify Arc Height

Adjust the parabolic arc height in the drawing functions:

```typescript
// For loops
const arcHeight = Math.min(Math.abs(x2 - x1) * 0.3, 200); // Change 0.3 or 200

// For gene-exon connections
const arcHeight = Math.min(Math.abs(exonMidX - geneX) * 0.2, 100); // Change 0.2 or 100
```

## Troubleshooting

### Data Not Showing
1. Check browser console for errors
2. Verify JSON file paths are correct
3. Ensure data matches the expected format
4. Check that chromosome names match (e.g., "chr12" vs "12")

### Performance Issues
- Filter data to show only visible region
- Implement data pagination for large datasets
- Use Web Workers for data processing

### Incorrect Positioning
- Verify coordinate values are integers
- Check that exon coordinates are properly formatted in the exon_id string
- Ensure chromosome start is 0
