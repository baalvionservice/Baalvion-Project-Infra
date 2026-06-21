"use client";

import React, { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  Html,
  QuadraticBezierLine,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { RegionData } from "@/hooks/use-simulation-data";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  RefreshCcw,
  Lock,
  TrendingUp,
  Users,
  ShoppingCart,
  Zap,
} from "lucide-react";

/**
 * Institutional Color Palette for Heatmap & Markers
 */
const HUB_COLORS = {
  high: "#22C55E", // Success Green
  medium: "#F59E0B", // Focus Amber
  low: "#3B82F6", // Authority Blue
  selected: "#FFFFFF", // Focus White
};

/**
 * Utility: Convert Lat/Lng to Vector3 on a sphere
 */
function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * HubPoint: The interactive marker node with Intelligence Overlay
 */
function HubPoint({
  region,
  maxRevenue,
  onClick,
  isSelected,
}: {
  region: RegionData;
  maxRevenue: number;
  onClick: (id: string) => void;
  isSelected: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const glowMesh = useRef<THREE.Mesh>(null!);
  const pos = useMemo(
    () => latLngToVector3(region.lat, region.lng, 2),
    [region.lat, region.lng]
  );

  const normalizedHeat = useMemo(
    () => Math.min(1, region.revenue / (maxRevenue || 1)),
    [region.revenue, maxRevenue]
  );

  const heatColor = useMemo(() => {
    if (isSelected) return HUB_COLORS.selected;
    if (normalizedHeat > 0.7) return HUB_COLORS.high;
    if (normalizedHeat > 0.35) return HUB_COLORS.medium;
    return HUB_COLORS.low;
  }, [normalizedHeat, isSelected]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(time * 3) * 0.15;
    const heatScale = isSelected ? 1.3 : 0.8 + normalizedHeat * 0.6;

    if (mesh.current) mesh.current.scale.setScalar(pulse * heatScale);
    if (glowMesh.current)
      glowMesh.current.scale.setScalar(
        pulse * (isSelected ? 5 : 4) * heatScale
      );
  });

  return (
    <group position={pos}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onClick(region.id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={heatColor} />
      </mesh>

      <mesh ref={glowMesh}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial
          color={heatColor}
          transparent
          opacity={isSelected ? 0.5 : 0.2 + normalizedHeat * 0.3}
        />
      </mesh>

      <Html distanceFactor={isSelected ? 10 : 15} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none">
          {!isSelected && (
            <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 border border-white/5 -translate-y-8 whitespace-nowrap shadow-2xl transition-all">
              <p className="text-[7px] font-bold text-white/60 uppercase tracking-[0.2em] font-mono">
                {region.id.toUpperCase()}
              </p>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function DataArc({
  start,
  end,
  intensity = 1,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  intensity?: number;
}) {
  const mid = start.clone().lerp(end, 0.5);
  const distance = start.distanceTo(end);
  mid.normalize().multiplyScalar(2 + distance * 0.25);

  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.dashOffset -= 0.005 * (0.5 + intensity);
    }
  });

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        color="#3B82F6"
        lineWidth={0.1}
        transparent
        opacity={0.05}
      />
      <QuadraticBezierLine
        ref={lineRef}
        start={start}
        end={end}
        mid={mid}
        color="#60A5FA"
        lineWidth={0.3}
        transparent
        opacity={0.2}
        dashed
        dashScale={50}
        dashSize={0.4}
        dashOffset={0}
      />
    </group>
  );
}

function GlobeSphere() {
  // Using a solid color instead of external texture to avoid 404 errors
  return (
    <Sphere args={[2, 64, 64]}>
      <meshStandardMaterial
        color="#0A0A0B"
        roughness={0.85}
        metalness={0.1}
        emissive="#050505"
        emissiveIntensity={0.15}
      />
    </Sphere>
  );
}

function Atmosphere() {
  return (
    <Sphere args={[2.15, 64, 64]}>
      <meshBasicMaterial
        color="#3B82F6"
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  );
}

function GlobeScene({
  regions,
  selectedHubId,
  onRegionClick,
  controlsRef,
}: {
  regions: Record<string, RegionData>;
  selectedHubId: string | null;
  onRegionClick: (id: string | null) => void;
  controlsRef: React.RefObject<any>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  const maxRevenue = useMemo(
    () => Math.max(...Object.values(regions).map((r) => r.revenue), 1),
    [regions]
  );

  const targetCamPos = useRef(new THREE.Vector3(0, 1, 6.5));
  const targetFocus = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedHubId && regions[selectedHubId]) {
      const reg = regions[selectedHubId];
      const pos = latLngToVector3(reg.lat, reg.lng, 2);
      targetCamPos.current.copy(pos).normalize().multiplyScalar(3.8);
      targetFocus.current.copy(pos);
    } else {
      targetCamPos.current.set(0, 1, 6.5);
      targetFocus.current.set(0, 0, 0);
    }
  }, [selectedHubId, regions]);

  useFrame((state) => {
    if (groupRef.current && !selectedHubId) {
      groupRef.current.rotation.y += 0.0006;
    }

    camera.position.lerp(targetCamPos.current, 0.06);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetFocus.current, 0.06);
      controlsRef.current.update();
    }
  });

  const arcs = useMemo(() => {
    if (!regions.in || !regions.us || !regions.uk || !regions.ae || !regions.sg)
      return [];
    const flows = [
      { s: regions.in, e: regions.us },
      { s: regions.uk, e: regions.ae },
      { s: regions.sg, e: regions.in },
    ];
    return flows.map((f) => ({
      start: latLngToVector3(f.s.lat, f.s.lng, 2),
      end: latLngToVector3(f.e.lat, f.e.lng, 2),
      intensity: (f.s.activeUsers + f.e.activeUsers) / 800,
    }));
  }, [regions]);

  return (
    <group ref={groupRef} onPointerMissed={() => onRegionClick(null)}>
      <Atmosphere />
      <Suspense
        fallback={
          <Sphere args={[2, 32, 32]}>
            <meshStandardMaterial color="#0A0A0B" />
          </Sphere>
        }
      >
        <GlobeSphere />
      </Suspense>

      {Object.values(regions).map((region) => (
        <HubPoint
          key={region.id}
          region={region}
          maxRevenue={maxRevenue}
          onClick={onRegionClick}
          isSelected={selectedHubId === region.id}
        />
      ))}

      {arcs.map((arc, idx) => (
        <DataArc
          key={idx}
          start={arc.start}
          end={arc.end}
          intensity={arc.intensity}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={8.0}
        rotateSpeed={0.5}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </group>
  );
}

export function IntelligenceGlobe({
  regions,
  selectedHubId,
  onRegionClick,
}: {
  regions: Record<string, RegionData>;
  selectedHubId: string | null;
  onRegionClick: (id: string | null) => void;
}) {
  const controlsRef = useRef<any>(null);

  const handleManualZoom = (direction: "in" | "out") => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const zoomFactor = direction === "in" ? 0.8 : 1.25;
      camera.position.multiplyScalar(zoomFactor);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing relative">
      <Canvas camera={{ position: [0, 1, 6.5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[-5, 5, 5]}
          intensity={1.5}
          color="#FFFFFF"
        />
        <pointLight position={[0, -5, 2]} intensity={0.5} color="#3B82F6" />

        <GlobeScene
          regions={regions}
          selectedHubId={selectedHubId}
          onRegionClick={onRegionClick}
          controlsRef={controlsRef}
        />
      </Canvas>

      {/* Tactical Hub Control Matrix */}
      <div className="absolute bottom-8 right-8 flex flex-col space-y-2 pointer-events-auto">
        <button
          onClick={() => onRegionClick(null)}
          className="w-10 h-10 bg-[#111113]/80 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white/30 hover:text-white hover:border-blue-500/50 transition-all shadow-2xl group rounded-none"
          aria-label="Master Reset"
        >
          <RefreshCcw
            size={14}
            className="group-hover:rotate-180 transition-transform duration-700"
          />
        </button>
        <button
          onClick={() => handleManualZoom("in")}
          className="w-10 h-10 bg-[#111113]/80 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white/30 hover:text-white hover:border-blue-500/50 transition-all shadow-2xl rounded-none"
          aria-label="Inc. Zoom"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => handleManualZoom("out")}
          className="w-10 h-10 bg-[#111113]/80 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white/30 hover:text-white hover:border-blue-500/50 transition-all shadow-2xl rounded-none"
          aria-label="Dec. Zoom"
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}
