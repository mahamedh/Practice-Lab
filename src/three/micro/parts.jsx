import React, { forwardRef, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { useLabStore } from "../../sim/labStore";

export const MAT = {
  oxygen: new THREE.MeshStandardMaterial({ color: "#ef4444", roughness: 0.35 }),
  hydrogen: new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.35 }),
  carbon: new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.4 }),
  sulfur: new THREE.MeshStandardMaterial({ color: "#facc15", roughness: 0.4, emissive: "#a16207", emissiveIntensity: 0.4 }),
  sugar: new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.35, emissive: "#b45309", emissiveIntensity: 0.35 }),
  atp: new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 1.2, roughness: 0.3 }),
  adp: new THREE.MeshStandardMaterial({ color: "#a8a29e", roughness: 0.5 }),
  nadph: new THREE.MeshStandardMaterial({ color: "#22d3ee", emissive: "#06b6d4", emissiveIntensity: 1.2, roughness: 0.3 }),
  nadp: new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.5 }),
  tracer: new THREE.MeshBasicMaterial({ color: new THREE.Color("#22c55e").multiplyScalar(1.3), transparent: true, opacity: 0.6, depthWrite: false }),
  originCo2: new THREE.MeshBasicMaterial({ color: "#e879f9", transparent: true, opacity: 0.35, depthWrite: false }),
  originH2o: new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.35, depthWrite: false }),
};

const SPHERE = new THREE.SphereGeometry(1, 18, 14);
const HEX = new THREE.CylinderGeometry(1, 1, 0.45, 6);

function Atom({ material, r, position }) {
  return <mesh geometry={SPHERE} material={material} scale={r} position={position} />;
}

export function Molecule({ kind }) {
  switch (kind) {
    case "h2o":
      return (
        <>
          <Atom material={MAT.oxygen} r={0.07} />
          <Atom material={MAT.hydrogen} r={0.045} position={[0.07, 0.05, 0]} />
          <Atom material={MAT.hydrogen} r={0.045} position={[-0.07, 0.05, 0]} />
        </>
      );
    case "h2s":
      return (
        <>
          <Atom material={MAT.sulfur} r={0.08} />
          <Atom material={MAT.hydrogen} r={0.045} position={[0.08, 0.05, 0]} />
          <Atom material={MAT.hydrogen} r={0.045} position={[-0.08, 0.05, 0]} />
        </>
      );
    case "co2":
      return (
        <>
          <Atom material={MAT.carbon} r={0.06} />
          <Atom material={MAT.oxygen} r={0.055} position={[0.1, 0, 0]} />
          <Atom material={MAT.oxygen} r={0.055} position={[-0.1, 0, 0]} />
        </>
      );
    case "o2":
      return (
        <>
          <Atom material={MAT.oxygen} r={0.06} position={[0.045, 0, 0]} />
          <Atom material={MAT.oxygen} r={0.06} position={[-0.045, 0, 0]} />
        </>
      );
    case "s":
      return <Atom material={MAT.sulfur} r={0.075} />;
    case "sugar":
      return <mesh geometry={HEX} material={MAT.sugar} scale={0.09} rotation={[Math.PI / 2, 0, 0]} />;
    case "atp":
      return (
        <>
          <Atom material={MAT.atp} r={0.06} />
          {[0, 1, 2].map((i) => (
            <Atom key={i} material={MAT.atp} r={0.022} position={[0.07 + i * 0.035, 0, 0]} />
          ))}
        </>
      );
    case "adp":
      return (
        <>
          <Atom material={MAT.adp} r={0.055} />
          {[0, 1].map((i) => (
            <Atom key={i} material={MAT.adp} r={0.02} position={[0.065 + i * 0.033, 0, 0]} />
          ))}
        </>
      );
    case "nadph":
      return <Atom material={MAT.nadph} r={0.06} />;
    case "nadp":
      return <Atom material={MAT.nadp} r={0.055} />;
    default:
      return <Atom material={MAT.oxygen} r={0.05} />;
  }
}

// Particles travelling along a curve; spawn rate and labeling come from callbacks read every frame.
export function Flow({ points, kind, rate, duration = 2.4, max = 14, scale = 1, labelled, origin, jitter = 0.08 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const groups = useRef([]);
  const halos = useRef([]);
  const parts = useRef(Array.from({ length: max }, () => ({ alive: false, t: 0, labelled: false, off: new THREE.Vector3(), spin: 0 })));
  const acc = useRef(Math.random());
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1);
    const r = Math.max(0, rate());
    acc.current += r * d;
    const originView = origin && useLabStore.getState().eqView === "origin";
    while (acc.current >= 1) {
      acc.current -= 1;
      const p = parts.current.find((x) => !x.alive);
      if (!p) break;
      p.alive = true;
      p.t = 0;
      p.labelled = Boolean(labelled?.());
      p.off.set((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter);
      p.spin = (Math.random() - 0.5) * 3;
    }
    parts.current.forEach((p, i) => {
      const g = groups.current[i];
      if (!g) return;
      if (!p.alive) {
        g.visible = false;
        return;
      }
      p.t += d / duration;
      if (p.t >= 1) {
        p.alive = false;
        g.visible = false;
        return;
      }
      curve.getPointAt(p.t, pos);
      g.position.copy(pos).add(p.off);
      g.rotation.z += p.spin * d;
      g.rotation.y += p.spin * 0.6 * d;
      const fade = Math.min(1, p.t * 8, (1 - p.t) * 8);
      g.scale.setScalar(scale * fade);
      g.visible = true;
      const halo = halos.current[i];
      if (halo) {
        halo.visible = Boolean(p.labelled || originView);
        halo.material = p.labelled ? MAT.tracer : origin === "co2" ? MAT.originCo2 : MAT.originH2o;
      }
    });
  });

  return (
    <group>
      {parts.current.map((_, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} visible={false}>
          <Molecule kind={kind} />
          <mesh ref={(el) => (halos.current[i] = el)} geometry={SPHERE} material={MAT.tracer} scale={0.16} visible={false} />
        </group>
      ))}
    </group>
  );
}

const TAG_TONES = {
  dark: "bg-slate-950/75 text-white ring-1 ring-white/15",
  green: "bg-emerald-500/90 text-emerald-950",
  amber: "bg-amber-300/95 text-amber-950",
  sky: "bg-sky-400/95 text-sky-950",
  violet: "bg-violet-400/95 text-violet-950",
  red: "bg-rose-500/90 text-white",
  slate: "bg-slate-200/95 text-slate-900",
};

// HTML label in the scene. With `drop`, it becomes a drop target for dragged tokens.
export function Tag({ position, children, tone = "dark", dot, drop, small, hidden }) {
  const dragToken = useLabStore((s) => s.dragToken);
  const accepting = drop && dragToken?.accepts?.includes(drop);
  if (hidden) return null;
  return (
    <Html position={position} center zIndexRange={[20, 0]} className={accepting ? "" : "pointer-events-none select-none"}>
      <div
        data-drop={drop}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold shadow-lg transition ${small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${TAG_TONES[tone]} ${
          accepting ? "scale-125 ring-4 ring-lime-300 ring-offset-2 ring-offset-transparent" : ""
        }`}
      >
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {children}
      </div>
    </Html>
  );
}

// Clickable structure with hover outline and an optional highlight pulse.
export const Pickable = forwardRef(function Pickable({ id, children, enabled = true, highlight, onPick, ...props }, ref) {
  const [hovered, setHovered] = useState(false);
  const pickStructure = useLabStore((s) => s.pickStructure);
  return (
    <Select enabled={(hovered && enabled) || Boolean(highlight)}>
      <group
        ref={ref}
        {...props}
        onPointerOver={(e) => {
          if (!enabled) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          if (!enabled) return;
          e.stopPropagation();
          (onPick ?? pickStructure)(id);
        }}
      >
        {children}
      </group>
    </Select>
  );
});

// Pulsing ring plus a button that zooms one level deeper.
export function Hotspot({ position, label, level, visible = true, radius = 0.22 }) {
  const ring = useRef();
  const zoomTo = useLabStore((s) => s.zoomTo);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const k = 1 + 0.25 * Math.sin(clock.elapsedTime * 3.2);
    ring.current.scale.setScalar(k);
    ring.current.material.opacity = 0.9 - 0.4 * (k - 0.75);
  });
  if (!visible) return null;
  return (
    <group position={position}>
      <mesh ref={ring} onClick={() => zoomTo(level)}>
        <ringGeometry args={[radius * 0.82, radius, 40]} />
        <meshBasicMaterial color={new THREE.Color("#a3e635").multiplyScalar(2)} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Html center position={[0, radius + 0.22, 0]} zIndexRange={[30, 0]}>
        <button
          type="button"
          data-hotspot={level}
          onClick={() => zoomTo(level)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-lime-300 px-3 py-1.5 text-xs font-bold text-lime-950 shadow-xl ring-2 ring-white/70 transition hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
            <circle cx="11" cy="11" r="7" />
            <path d="M11 8v6M8 11h6M20 20l-4-4" />
          </svg>
          {label}
        </button>
      </Html>
    </group>
  );
}

export function useEase(get, speed = 4, initial) {
  const v = useRef(initial ?? get());
  useFrame((_, dt) => {
    v.current = THREE.MathUtils.damp(v.current, get(), speed, Math.min(dt, 0.05));
  });
  return v;
}
