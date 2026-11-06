import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import chapter from "../../data/chapter10_2.json";
import { Hotspot, Tag } from "./parts";

const S = chapter.zoom.structures;
const LEVELS = chapter.zoom.levels;

const lensGeo = new THREE.SphereGeometry(1, 24, 16);
const chloroMat = new THREE.MeshStandardMaterial({ color: "#16a34a", roughness: 0.4, emissive: "#14532d", emissiveIntensity: 0.5 });
const stripeMat = new THREE.MeshStandardMaterial({ color: "#065f46", roughness: 0.5 });

function MiniChloroplast({ scale = 1 }) {
  return (
    <group scale={scale}>
      <mesh geometry={lensGeo} material={chloroMat} scale={[0.14, 0.065, 0.09]} />
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={x} position={[x, 0, 0.07]} material={stripeMat}>
          <boxGeometry args={[0.022, 0.07, 0.015]} />
        </mesh>
      ))}
    </group>
  );
}

const STREAM_COUNT = 34;

function streamLoop(z, wobble) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 1.5, Math.sin(a) * 0.9, z + Math.sin(a * 2) * wobble));
  }
  return new THREE.CatmullRomCurve3(pts, true);
}

export function MesophyllCell() {
  const refs = useRef([]);
  const loops = useMemo(() => [streamLoop(0.42, 0.1), streamLoop(-0.3, 0.12)], []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.012;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const loop = loops[i % 2];
      const u = (Math.floor(i / 2) / (STREAM_COUNT / 2) + (i % 2) * 0.03 + t * (i % 2 ? 0.8 : 1)) % 1;
      loop.getPointAt(u, tmp);
      loop.getTangentAt(u, tan);
      g.position.copy(tmp);
      g.rotation.z = Math.atan2(tan.y, tan.x);
    });
  });

  return (
    <group>
      <RoundedBox args={[3.7, 2.4, 1.6]} radius={0.35} smoothness={6}>
        <meshPhysicalMaterial color="#bbf7d0" roughness={0.4} transparent opacity={0.22} depthWrite={false} />
      </RoundedBox>
      <RoundedBox args={[3.82, 2.52, 1.72]} radius={0.4} smoothness={6}>
        <meshStandardMaterial color="#4d7c0f" roughness={0.7} transparent opacity={0.35} side={THREE.BackSide} depthWrite={false} />
      </RoundedBox>
      <mesh position={[0.15, -0.05, -0.1]} scale={[1.2, 0.68, 0.5]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial color="#bae6fd" roughness={0.1} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group position={[-1.2, 0.55, 0.25]}>
        <mesh>
          <sphereGeometry args={[0.3, 28, 20]} />
          <meshStandardMaterial color="#a78bfa" roughness={0.45} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.06, 0.05, 0.18]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial color="#5b21b6" roughness={0.5} />
        </mesh>
      </group>
      {Array.from({ length: STREAM_COUNT }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <MiniChloroplast />
        </group>
      ))}
      <group position={[0.95, -0.62, 0.72]}>
        <MiniChloroplast scale={2.2} />
        <mesh scale={[0.42, 0.22, 0.3]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color={new THREE.Color("#4ade80").multiplyScalar(1.6)} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>

      <Tag position={[-1.85, 1.35, 0.6]} small>{S.cellWall}</Tag>
      <Tag position={[0.2, 0.15, 0.6]} small tone="sky">{S.vacuole}</Tag>
      <Tag position={[-1.2, 0.98, 0.3]} small tone="violet">{S.nucleus}</Tag>
      <Tag position={[1.6, 1.05, 0.6]} small tone="green">30–40 chloroplasts</Tag>
      <Hotspot position={[0.95, -0.62, 0.9]} label={LEVELS[1].hotspot} level={2} radius={0.3} />
    </group>
  );
}

const GRANA = [
  [-1.25, 0.05, 0.1, 7], [-0.6, -0.25, 0.35, 6], [-0.35, 0.3, -0.2, 8], [0.25, -0.05, 0.4, 7], [0.55, 0.28, -0.15, 5], [1.1, -0.15, 0.1, 7], [0.0, -0.38, -0.35, 5],
];
const discMat = new THREE.MeshStandardMaterial({ color: "#22c55e", roughness: 0.35, emissive: "#15803d", emissiveIntensity: 0.6 });
const lumenMat = new THREE.MeshStandardMaterial({ color: "#d9f99d", roughness: 0.6 });

function Granum({ position, count, open }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} position={[0, (i - (count - 1) / 2) * 0.062, 0]}>
          <mesh material={discMat}>
            <cylinderGeometry args={[0.2, 0.2, 0.045, 28, 1, false, 0, open ? Math.PI * 1.5 : Math.PI * 2]} />
          </mesh>
          {open && (
            <mesh material={lumenMat}>
              <cylinderGeometry args={[0.17, 0.17, 0.022, 24, 1, false, Math.PI * 1.5, Math.PI * 0.5]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function ChloroplastBody() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.12;
  });
  return (
    <group ref={group}>
      <mesh scale={[2.15, 0.9, 1.1]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial color="#86efac" roughness={0.2} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh scale={[2.02, 0.82, 1.0]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial color="#4ade80" roughness={0.3} transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[1.95, 0.77, 0.95]}>
        <sphereGeometry args={[1, 40, 28]} />
        <meshStandardMaterial color="#dcfce7" roughness={0.8} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {GRANA.map(([x, y, z, n], i) => (
        <Granum key={i} position={[x, y, z]} count={n} open={i === 3} />
      ))}
      {GRANA.slice(0, -1).map(([x, y, z], i) => {
        const [x2, y2, z2] = GRANA[i + 1];
        const a = new THREE.Vector3(x, y, z);
        const b = new THREE.Vector3(x2, y2, z2);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const len = a.distanceTo(b);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        return (
          <mesh key={i} position={mid} rotation={[0, -Math.atan2(b.z - a.z, b.x - a.x), angle]} material={discMat}>
            <boxGeometry args={[len, 0.018, 0.09]} />
          </mesh>
        );
      })}

      <Tag position={[-1.55, 0.95, 0.4]} small>{S.outerMembrane}</Tag>
      <Tag position={[-2.35, 0.25, 0.3]} small>{S.intermembrane}</Tag>
      <Tag position={[-1.75, -0.75, 0.5]} small>{S.innerMembrane}</Tag>
      <Tag position={[0.95, -0.55, 0.75]} small tone="violet">{S.stroma}</Tag>
      <Tag position={[-1.25, 0.42, 0.4]} small tone="green">{S.granum}</Tag>
      <Tag position={[0.25, 0.28, 0.75]} small tone="green">{S.thylakoid}</Tag>
      <Tag position={[0.55, -0.02, 0.95]} small tone="amber">{S.thylakoidSpace}</Tag>
      <Tag position={[1.55, 0.8, 0.4]} small tone="slate">2–4 × 4–7 µm</Tag>
    </group>
  );
}

export function ChloroplastModel() {
  return (
    <>
      <ChloroplastBody />
      <Hotspot position={[0.25, -0.05, 1.0]} label={LEVELS[2].hotspot} level={3} radius={0.3} />
    </>
  );
}
