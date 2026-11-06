import React, { useMemo } from "react";
import * as THREE from "three";
import { BENCH_TOP, POT_HEIGHT, POT_RADIUS } from "../layout";

const noRaycast = () => null;

export default function Pot() {
  const geometry = useMemo(() => {
    const r = POT_RADIUS;
    const h = POT_HEIGHT;
    const points = [
      [0, 0],
      [r * 0.68, 0],
      [r * 0.72, 0.015],
      [r * 0.9, h * 0.78],
      [r * 0.97, h * 0.8],
      [r * 1.02, h * 0.84],
      [r * 1.02, h],
      [r * 0.94, h],
      [r * 0.9, h * 0.86],
      [r * 0.86, h * 0.8],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(points, 48);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[0, BENCH_TOP, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow raycast={noRaycast}>
        <meshStandardMaterial color="#b8653d" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.012, 0]} castShadow receiveShadow raycast={noRaycast}>
        <cylinderGeometry args={[POT_RADIUS * 0.95, POT_RADIUS * 0.85, 0.025, 40]} />
        <meshStandardMaterial color="#a4583a" roughness={0.9} />
      </mesh>
    </group>
  );
}
