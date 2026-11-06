import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { Flow, Hotspot, Pickable, Tag } from "./parts";

const S = chapter.zoom.structures;
const W = 5;
const D = 2;

const PALISADE = [];
for (let ix = 0; ix < 14; ix++) for (const z of [-0.62, 0, 0.62]) PALISADE.push([-W / 2 + 0.2 + ix * 0.35, 0.3, z]);
export const TARGET_CELL = [0.15, 0.3, 0.62];
const SPONGY = [
  [-2.1, -0.28, -0.5], [-1.6, -0.42, 0.4], [-1.9, -0.3, 0.55], [-0.95, -0.25, -0.45], [-0.4, -0.45, 0.5], [-0.25, -0.22, -0.2],
  [0.35, -0.42, -0.55], [1.55, -0.3, 0.45], [1.9, -0.44, -0.3], [2.2, -0.26, 0.6], [-1.3, -0.48, -0.15], [0.05, -0.3, 0.25],
  [1.45, -0.48, -0.62], [2.25, -0.4, 0.05], [-2.2, -0.45, 0.05],
];
const STOMATA = [[-1.2, -0.8, 0.78], [1.85, -0.8, -0.25]];

const POINTS = {
  outside: [-1.2, -1.45, 0.78],
  stoma: [-1.2, -0.74, 0.78],
  airSpace: [-0.75, -0.3, 0.62],
  mesophyllCell: [TARGET_CELL[0], 0.12, 0.8],
  chloroplast: [TARGET_CELL[0] + 0.08, 0.36, 0.78],
};

const cellMat = new THREE.MeshPhysicalMaterial({ color: "#86efac", roughness: 0.5, transmission: 0.2, transparent: true, opacity: 0.55 });
const spongyMat = new THREE.MeshPhysicalMaterial({ color: "#bbf7d0", roughness: 0.6, transparent: true, opacity: 0.6 });
const chloroMat = new THREE.MeshStandardMaterial({ color: "#16a34a", roughness: 0.45, emissive: "#14532d", emissiveIntensity: 0.4 });
const targetChloroMat = new THREE.MeshStandardMaterial({ color: "#22c55e", roughness: 0.4, emissive: "#22c55e", emissiveIntensity: 0.9 });

function chloroplastsFor(center, count, radius, height, seed) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + seed;
    const y = center[1] + ((i % 3) - 1) * height * 0.28;
    out.push([center[0] + Math.cos(a) * radius, y, center[2] + Math.sin(a) * radius]);
  }
  return out;
}

function Instanced({ positions, geometry, material, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    positions.forEach((p, i) => {
      const s = Array.isArray(scale[0]) ? scale[i] : scale;
      m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(...s));
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [positions, scale, rotation]);
  return <instancedMesh ref={ref} args={[geometry, material, positions.length]} />;
}

export default function LeafSection() {
  const path = useLabStore((s) => s.co2Path);
  const done = path.done;
  const expected = chapter.co2Path.order[path.picked.length];
  const geo = useMemo(
    () => ({
      capsule: new THREE.CapsuleGeometry(0.12, 0.34, 6, 14),
      sphere: new THREE.SphereGeometry(1, 16, 12),
      chloro: new THREE.SphereGeometry(1, 12, 8),
    }),
    [],
  );
  const palisade = useMemo(() => PALISADE.filter((p) => !(p[0] === TARGET_CELL[0] && p[2] === TARGET_CELL[2])), []);
  const chloros = useMemo(() => palisade.flatMap((p, i) => chloroplastsFor(p, 6, 0.1, 0.4, i)), [palisade]);
  const spongyChloros = useMemo(() => SPONGY.flatMap((p, i) => chloroplastsFor(p, 4, 0.15, 0.2, i * 1.7)), []);
  const targetChloros = useMemo(() => chloroplastsFor(TARGET_CELL, 9, 0.105, 0.4, 0.4), []);
  const spongyScales = useMemo(() => SPONGY.map((_, i) => [0.2 + (i % 3) * 0.03, 0.15 + (i % 2) * 0.03, 0.2]), []);

  const linePoints = [POINTS.outside, ...path.picked.map((id) => POINTS[id])];
  const pathRate = (id) => () => (path.picked.includes(id) || done ? 3 : 0);

  return (
    <group position={[0, 0.05, 0]}>
      {/* Cuticle and upper epidermis */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[W, 0.035, D]} />
        <meshPhysicalMaterial color="#d9f99d" roughness={0.15} clearcoat={1} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.69, 0]}>
        <boxGeometry args={[W, 0.14, D]} />
        <meshPhysicalMaterial color="#ecfccb" roughness={0.5} transparent opacity={0.55} />
      </mesh>

      {/* Palisade mesophyll */}
      <Instanced positions={palisade} geometry={geo.capsule} material={cellMat} />
      <Instanced positions={chloros} geometry={geo.chloro} material={chloroMat} scale={[0.035, 0.05, 0.035]} />

      <Pickable id="mesophyllCell" enabled={!path.picked.includes("mesophyllCell")} highlight={done}>
        <mesh geometry={geo.capsule} position={TARGET_CELL} scale={1.05}>
          <meshPhysicalMaterial color="#a3e635" roughness={0.4} transparent opacity={0.5} emissive="#4d7c0f" emissiveIntensity={0.35} />
        </mesh>
      </Pickable>
      <Pickable id="chloroplast" enabled={!done}>
        <Instanced positions={targetChloros} geometry={geo.chloro} material={targetChloroMat} scale={[0.045, 0.06, 0.045]} />
      </Pickable>

      {/* Spongy mesophyll and air spaces */}
      <Instanced positions={SPONGY} geometry={geo.sphere} material={spongyMat} scale={spongyScales} />
      <Instanced positions={spongyChloros} geometry={geo.chloro} material={chloroMat} scale={[0.035, 0.035, 0.035]} />
      <Pickable id="airSpace" enabled={expected === "airSpace"}>
        <mesh position={[0, -0.33, 0]}>
          <boxGeometry args={[W - 0.1, 0.5, D - 0.1]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.07} depthWrite={false} />
        </mesh>
      </Pickable>

      {/* Vein */}
      <group position={[0.95, -0.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.27, 0.27, D, 24, 1, true]} />
          <meshPhysicalMaterial color="#bef264" roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.09, 0.09, D, 18]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, D, 18]} />
          <meshStandardMaterial color="#fb923c" roughness={0.4} transparent opacity={0.85} />
        </mesh>
        <Flow points={[[0, 0.08, -1], [0, 0.08, 0], [0, 0.08, 1]]} kind="h2o" rate={() => 2.2} duration={3} max={8} scale={0.8} jitter={0.02} />
        <Flow points={[[0, -0.1, 1], [0, -0.1, 0], [0, -0.1, -1]]} kind="sugar" rate={() => 1.5} duration={3} max={6} scale={0.7} jitter={0.02} />
      </group>

      {/* Lower epidermis and stomata */}
      <mesh position={[0, -0.69, 0]}>
        <boxGeometry args={[W, 0.12, D]} />
        <meshPhysicalMaterial color="#ecfccb" roughness={0.5} transparent opacity={0.5} />
      </mesh>
      {STOMATA.map((p, i) => (
        <Pickable key={i} id="stoma" enabled={!done} highlight={!done && expected === "stoma" && i === 0 && path.wrong}>
          <group position={p}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
                <meshStandardMaterial color="#4ade80" roughness={0.4} />
              </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.2, 10]} />
              <meshBasicMaterial color="#052e16" />
            </mesh>
          </group>
        </Pickable>
      ))}

      {/* CO2 path */}
      <Flow points={[POINTS.outside, POINTS.stoma]} kind="co2" rate={pathRate("stoma")} duration={1.1} max={5} />
      <Flow points={[POINTS.stoma, [-1.0, -0.5, 0.72], POINTS.airSpace]} kind="co2" rate={pathRate("airSpace")} duration={1.2} max={5} />
      <Flow points={[POINTS.airSpace, [-0.3, -0.05, 0.75], POINTS.mesophyllCell]} kind="co2" rate={pathRate("mesophyllCell")} duration={1.3} max={5} />
      <Flow points={[POINTS.mesophyllCell, POINTS.chloroplast]} kind="co2" rate={pathRate("chloroplast")} duration={0.8} max={4} scale={0.8} />
      <Flow points={[[1.85, -0.7, -0.25], [1.85, -1.1, -0.1], [1.9, -1.6, 0.1]]} kind="o2" rate={() => 1.6} duration={1.8} max={6} />
      {path.picked.length > 0 && <Line points={linePoints} color="#a3e635" lineWidth={2.5} dashed dashSize={0.08} gapSize={0.05} />}

      <Tag position={[-2.05, 0.95, 0.9]} small>{S.cuticle}</Tag>
      <Tag position={[-2.6, 0.3, 0.9]} small>Palisade {S.mesophyll.toLowerCase()}</Tag>
      <Tag position={[-2.6, -0.32, 0.9]} small>Spongy {S.mesophyll.toLowerCase()}</Tag>
      <Tag position={[0.95, -0.2, 1.15]} small tone="sky">{S.vein}</Tag>
      <Tag position={[-1.2, -1.0, 0.9]} small tone="slate">{S.stoma}</Tag>
      <Tag position={[-0.6, -0.42, 1.1]} small>{S.airSpace}</Tag>
      <Tag position={[TARGET_CELL[0], 0.62, 0.9]} small tone="green">{S.mesophyllCell}</Tag>
      <Tag position={[1.85, -1.55, 0.2]} small tone="red" dot="#fecaca">O₂ out</Tag>
      <Tag position={[-1.2, -1.6, 0.78]} small tone="slate" dot="#334155">CO₂ in</Tag>

      <Hotspot position={[TARGET_CELL[0], TARGET_CELL[1], 0.86]} label={chapter.zoom.levels[0].hotspot} level={1} visible={done} />
    </group>
  );
}
