import React, { useRef, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

const DNAStrand = ({ length, radius, isDragging, isFlashing }: { length: number, radius: number, isDragging: boolean, isFlashing: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Random movement state
  const timeRef = useRef(0);
  const noiseOffset = useMemo(() => Math.random() * 100, []);

  // Flash animation state
  const flashIntensityRef = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current && !isDragging) {
      timeRef.current += delta;
      // Irregular movement using sine waves with different frequencies
      const t = timeRef.current;
      groupRef.current.rotation.z = Math.sin(t * 0.2 + noiseOffset) * 0.1 + Math.sin(t * 0.1) * 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.15 + noiseOffset) * 0.1;
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.5;
    }

    // Smooth flash transition
    const targetIntensity = isFlashing ? 1.0 : 0.0;
    flashIntensityRef.current = THREE.MathUtils.lerp(flashIntensityRef.current, targetIntensity, delta * 10);
  });

  // Parameters for horizontal helix
  // Maintain density: original was count 100 for length 60 => ratio ~1.67
  const count = Math.floor(length * 1.67);
  // Radius is now passed as prop
  const turns = length / 12; // Maintain turn density: original 5 turns for 60 length => 1 turn per 12 units

  // Scale ball radius with DNA radius to prevent gaps
  // Base radius 2.5 -> Ball radius 0.6 (Ratio ~0.24)
  const ballRadius = radius * 0.24;

  // Custom Gradient Stops - Repeated twice to reduce all color ranges by 50%
  const gradientStops = useMemo(() => [
    // Cycle 1 (0.0 - 0.5)
    { pos: 0.0, color: new THREE.Color('#1a237e') },    // Deep Blue
    { pos: 0.083, color: new THREE.Color('#00bcd4') },  // Cyan
    { pos: 0.21, color: new THREE.Color('#4caf50') },   // Green (Squeezed)
    { pos: 0.25, color: new THREE.Color('#ffff00') },   // Vivid Yellow
    { pos: 0.29, color: new THREE.Color('#ff9800') },   // Orange (Squeezed)
    { pos: 0.416, color: new THREE.Color('#f44336') },  // Red
    { pos: 0.5, color: new THREE.Color('#9c27b0') },    // Magenta

    // Cycle 2 (0.5 - 1.0)
    { pos: 0.501, color: new THREE.Color('#1a237e') },  // Deep Blue (Restart)
    { pos: 0.583, color: new THREE.Color('#00bcd4') },  // Cyan
    { pos: 0.71, color: new THREE.Color('#4caf50') },   // Green (Squeezed)
    { pos: 0.75, color: new THREE.Color('#ffff00') },   // Vivid Yellow
    { pos: 0.79, color: new THREE.Color('#ff9800') },   // Orange (Squeezed)
    { pos: 0.916, color: new THREE.Color('#f44336') },  // Red
    { pos: 1.0, color: new THREE.Color('#9c27b0') },    // Magenta
  ], []);

  const getColorAtPct = (pct: number) => {
    for (let i = 0; i < gradientStops.length - 1; i++) {
      if (pct >= gradientStops[i].pos && pct <= gradientStops[i + 1].pos) {
        const start = gradientStops[i];
        const end = gradientStops[i + 1];
        const t = (pct - start.pos) / (end.pos - start.pos);
        return start.color.clone().lerp(end.color, t);
      }
    }
    return gradientStops[gradientStops.length - 1].color.clone();
  };

  const data = useMemo(() => {
    const points = [];
    for (let i = 0; i < count; i++) {
      const pct = i / count;
      const t = pct * Math.PI * 2 * turns;

      // Horizontal Orientation (X-axis)
      const x = (pct * length) - (length / 2);

      // Helix coordinates in YZ plane
      const y1 = Math.cos(t) * radius;
      const z1 = Math.sin(t) * radius;

      const y2 = Math.cos(t + Math.PI) * radius;
      const z2 = Math.sin(t + Math.PI) * radius;

      // Interpolate color based on custom gradient stops
      const colorBase = getColorAtPct(pct);

      const color1 = colorBase;
      const color2 = colorBase.clone().offsetHSL(0.02, 0, -0.05);
      const rungColor = colorBase.clone().offsetHSL(0, 0, 0.1);

      points.push({
        pos1: [x, y1, z1] as [number, number, number],
        pos2: [x, y2, z2] as [number, number, number],
        center: [x, 0, 0] as [number, number, number],
        color1,
        color2,
        rungColor,
        // Rotation around X axis by angle t aligns the Y-axis cylinder with the vector (0, cos t, sin t)
        rotation: [t, 0, 0] as [number, number, number]
      });
    }
    return points;
  }, [gradientStops, count, length, turns, radius]);

  return (
    <group ref={groupRef}>
      {data.map((d, i) => (
        <group key={i}>
        <FlashSphere
          d={d}
          ballRadius={ballRadius}
          radius={radius}
          flashIntensityRef={flashIntensityRef}
        />
        </group>
      ))}
    </group>
  );
};

// Extracted component to handle per-sphere updates efficiently if needed,
// but for now we can just use a simple component to keep code clean and use useFrame inside if we want per-object updates,
// OR just pass the ref and update material in useFrame of parent.
// Actually, updating material uniforms or props in loop is expensive.
// Better approach: Use a custom shader material or update color prop in useFrame.
// But standard meshPhysicalMaterial color prop update might be slow for many objects.
// Let's try a simpler approach: The `isFlashing` prop triggers a re-render.
// The user wants SMOOTH transition.
// We can use `useFrame` to update the material's emissive intensity directly on the mesh refs.
// But we have many meshes.
// Optimization: Create ONE material (or a few) and share it? No, colors are different.
// We can iterate over group children in useFrame.

const FlashSphere = ({ d, ballRadius, radius, flashIntensityRef }: { d: any, ballRadius: number, radius: number, flashIntensityRef: React.MutableRefObject<number> }) => {
  const mat1 = useRef<THREE.MeshPhysicalMaterial>(null);
  const mat2 = useRef<THREE.MeshPhysicalMaterial>(null);
  const matRung = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (mat1.current) {
      mat1.current.emissiveIntensity = 0.4 + flashIntensityRef.current * 0.6; // Base 0.4 -> 1.0
      // We can also blend color to white
      mat1.current.emissive.lerpColors(d.color1, new THREE.Color('white'), flashIntensityRef.current);
      mat1.current.color.lerpColors(d.color1, new THREE.Color('white'), flashIntensityRef.current);
    }
    if (mat2.current) {
      mat2.current.emissiveIntensity = 0.4 + flashIntensityRef.current * 0.6;
      mat2.current.emissive.lerpColors(d.color2, new THREE.Color('white'), flashIntensityRef.current);
      mat2.current.color.lerpColors(d.color2, new THREE.Color('white'), flashIntensityRef.current);
    }
    if (matRung.current) {
      matRung.current.emissiveIntensity = 0.2 + flashIntensityRef.current * 0.8; // Base 0.2 -> 1.0
      matRung.current.emissive.lerpColors(d.rungColor, new THREE.Color('white'), flashIntensityRef.current);
      matRung.current.color.lerpColors(d.rungColor, new THREE.Color('white'), flashIntensityRef.current);
    }
  });

  return (
    <React.Fragment>
      <Sphere position={d.pos1} args={[ballRadius, 32, 32]}>
        <meshPhysicalMaterial
          ref={mat1}
          color={d.color1}
          metalness={0.4}
          roughness={0.1}
          clearcoat={1}
          emissive={d.color1}
          emissiveIntensity={0.4}
        />
      </Sphere>

      <Sphere position={d.pos2} args={[ballRadius, 32, 32]}>
        <meshPhysicalMaterial
          ref={mat2}
          color={d.color2}
          metalness={0.4}
          roughness={0.1}
          clearcoat={1}
          emissive={d.color2}
          emissiveIntensity={0.4}
        />
      </Sphere>

      <Cylinder
        args={[0.16, 0.16, radius * 2, 12]}
        position={d.center}
        rotation={d.rotation}
      >
        <meshStandardMaterial
          ref={matRung}
          color={d.rungColor}
          metalness={0.3}
          roughness={0.4}
          emissive={d.rungColor}
          emissiveIntensity={0.2}
        />
      </Cylinder>
    </React.Fragment>
  );
};

export const ThreeDNA: React.FC = () => {
  // Initial length set to 12.5 (25% increase from min 10)
  const [dnaLength, setDnaLength] = useState(12.5);
  // Initial radius calculated based on length 12.5 with 2/3 scaling ratio from base (10, 1.8)
  // Radius = 1.8 * (1 + ((12.5 - 10) / 10) * (2/3)) = 1.8 * (1 + 0.25 * 0.666) = 2.1
  const [dnaRadius, setDnaRadius] = useState(2.1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Refs for state access in event listeners and timeout management
  const dnaLengthRef = useRef(12.5);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const triggerFlash = () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      setIsFlashing(true);
      flashTimeoutRef.current = setTimeout(() => setIsFlashing(false), 500);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.05;

      // Check limits using the ref for immediate feedback
      const currentLength = dnaLengthRef.current;
      const potentialLength = currentLength + delta;

      // Trigger flash if hitting or exceeding limits
      // Min limit: 10
      if (potentialLength <= 10 && delta < 0) {
        triggerFlash();
      }
      // Max limit: 35
      else if (potentialLength >= 35 && delta > 0) {
        triggerFlash();
      }

      setDnaLength(prevLength => {
        // Min length 10, Max length 35 (3.5x min)
        const newLength = Math.min(Math.max(prevLength + delta, 10), 35);

        // Sync ref
        dnaLengthRef.current = newLength;

        // Calculate radius change based on length change ratio (2/3)
        // Base Length: 10, Base Radius: 1.8
        // Formula: newRadius = baseRadius * (1 + (newLength - baseLength) / baseLength * (2/3))
        const baseLength = 10;
        const baseRadius = 1.8;
        const lengthChangeRatio = (newLength - baseLength) / baseLength;
        const newRadius = baseRadius * (1 + lengthChangeRatio * (2 / 3));

        setDnaRadius(newRadius);
        return newLength;
      });
    };

    // Add non-passive listener to effectively prevent default
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 w-full h-full bg-[#0f0c29]"
    >
      {/* 
         Background Image Layer
         1. Priority: ./background.png (Your attached high-res file)
         2. Fallback: High-quality Unsplash image if local file is missing
         
         Note: Ensure your local 'background.png' is 2560x1440 for best results.
       */}
      <img
        src="./background.png"
        onError={(e) => {
          e.currentTarget.src = "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=100&w=2560&auto=format&fit=crop";
        }}
        alt="Bio Nebula Background"
        className="absolute inset-0 w-full h-full object-cover opacity-100"
        style={{ imageRendering: 'auto' }} // Optimize for high quality
      />

      <Canvas camera={{ position: [0, 0, 22], fov: 30 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} />
        <pointLight position={[0, 0, 20]} intensity={1.0} />

        <DNAStrand length={dnaLength} radius={dnaRadius} isDragging={isDragging} isFlashing={isFlashing} />

        {/* Sparkles for added depth blending with the background particles */}
        <Sparkles count={60} scale={40} size={4} speed={0.4} opacity={0.6} color="#a5b4fc" />

        <OrbitControls
          makeDefault
          enableRotate={true}
          rotateSpeed={0.5}
          enableZoom={false}
          enablePan={false}
          onStart={() => setIsDragging(true)}
          onEnd={() => setIsDragging(false)}
        />
      </Canvas>
    </div>
  );
};
