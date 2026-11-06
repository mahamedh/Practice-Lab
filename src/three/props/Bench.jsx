import React, { useMemo } from "react";
import * as THREE from "three";
import models from "../../data/models.json";
import ModelOrFallback from "./ModelOrFallback";
import { BENCH_TOP } from "../layout";
import { woodTexture } from "../textures";

const noRaycast = () => null;

function CodeBench() {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b98a5c", map: woodTexture(), roughness: 0.75 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7d5636", map: woodTexture(), roughness: 0.8 }), []);
  return (
    <group>
      <mesh position={[0, BENCH_TOP - 0.03, 0]} material={wood} castShadow receiveShadow raycast={noRaycast}>
        <boxGeometry args={[1.9, 0.06, 0.85]} />
      </mesh>
      {[
        [-0.88, -0.36],
        [0.88, -0.36],
        [-0.88, 0.36],
        [0.88, 0.36],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, (BENCH_TOP - 0.06) / 2, z]} material={dark} castShadow receiveShadow raycast={noRaycast}>
          <boxGeometry args={[0.07, BENCH_TOP - 0.06, 0.07]} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]} material={dark} castShadow receiveShadow raycast={noRaycast}>
        <boxGeometry args={[1.8, 0.035, 0.75]} />
      </mesh>
      {[-0.5, -0.15, 0.25].map((x, i) => (
        <mesh key={x} position={[x, 0.29, (i - 1) * 0.12]} castShadow raycast={noRaycast}>
          <cylinderGeometry args={[0.1, 0.08, 0.11, 16]} />
          <meshStandardMaterial color="#a85e3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function Bench() {
  return <ModelOrFallback config={models.bench} fallback={<CodeBench />} />;
}
