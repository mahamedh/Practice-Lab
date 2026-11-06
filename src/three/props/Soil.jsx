import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLabStore } from "../../sim/labStore";
import TargetRing from "../interactive/TargetRing";
import { SOIL_RADIUS, SOIL_Y, sceneRefs } from "../layout";
import { crackTexture, soilTexture } from "../textures";

const DRY = new THREE.Color("#d2b48a");
const WET = new THREE.Color("#3a2416");
const noRaycast = () => null;

export default function Soil() {
  const soil = useRef();
  const cracks = useRef();
  const scenario = useRef(useLabStore.getState().scenarioId);

  const geometry = useMemo(() => {
    const g = new THREE.CircleGeometry(SOIL_RADIUS, 48, 0, Math.PI * 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i)) / SOIL_RADIUS;
      pos.setZ(i, (1 - r * r) * 0.025);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const pebbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = i * 2.39996;
        const r = Math.sqrt((i + 0.5) / 18) * SOIL_RADIUS * 0.9;
        return { p: [Math.cos(a) * r, 0.012 + (1 - (r / SOIL_RADIUS) ** 2) * 0.022, Math.sin(a) * r], s: 0.008 + ((i * 37) % 10) / 900 };
      }),
    []
  );

  useFrame((_, dt) => {
    const s = useLabStore.getState();
    const target = s.inputs.water / 100;
    if (scenario.current !== s.scenarioId) {
      scenario.current = s.scenarioId;
      sceneRefs.moisture = target;
    }
    sceneRefs.moisture = THREE.MathUtils.damp(sceneRefs.moisture, target, 1.6, dt);
    const m = sceneRefs.moisture;
    soil.current.color.copy(DRY).lerp(WET, Math.pow(m, 0.8));
    soil.current.roughness = 1 - m * 0.55;
    cracks.current.opacity = THREE.MathUtils.clamp((0.45 - m) / 0.3, 0, 1);
  });

  return (
    <group position={[0, SOIL_Y, 0]}>
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow raycast={noRaycast}>
        <meshStandardMaterial ref={soil} map={soilTexture()} roughness={1} />
      </mesh>
      <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} raycast={noRaycast}>
        <meshStandardMaterial ref={cracks} map={crackTexture()} transparent depthWrite={false} roughness={1} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {pebbles.map((p, i) => (
        <mesh key={i} position={p.p} scale={p.s} castShadow raycast={noRaycast}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 ? "#8d8173" : "#a39887"} roughness={0.9} />
        </mesh>
      ))}
      <TargetRing variable="water" only="limiting" radius={SOIL_RADIUS + 0.06} position={[0, 0.05, 0]} />
    </group>
  );
}
