import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { getGuide, useLabStore } from "../../sim/labStore";

const COLORS = {
  marker: new THREE.Color("#fcd34d").multiplyScalar(2.2),
  limiting: new THREE.Color("#ff5f7a").multiplyScalar(2.6),
};

export function useTargetTone(variable) {
  return useLabStore((s) => {
    if (s.dragging) return null;
    const g = getGuide(s);
    if (g.glow?.includes(variable)) return "limiting";
    if (g.marker === variable) return "marker";
    return null;
  });
}

function Ring({ tone, radius }) {
  const outer = useRef();
  const inner = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (tone === "limiting" ? 3.2 : 2);
    const pulse = (Math.sin(t) + 1) / 2;
    outer.current.scale.setScalar(1 + pulse * 0.18);
    outer.current.material.opacity = 0.25 + (1 - pulse) * 0.55;
    inner.current.material.opacity = 0.55 + pulse * 0.35;
  });
  return (
    <group>
      <mesh ref={outer} raycast={() => null}>
        <ringGeometry args={[radius * 0.96, radius * 1.04, 64]} />
        <meshBasicMaterial color={COLORS[tone]} transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={inner} raycast={() => null}>
        <ringGeometry args={[radius * 0.8, radius * 0.86, 64]} />
        <meshBasicMaterial color={COLORS[tone]} transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function TargetRing({ variable, radius = 0.3, billboard = false, only, ...props }) {
  const tone = useTargetTone(variable);
  if (!tone || (only && tone !== only)) return null;
  if (billboard) {
    return (
      <Billboard {...props}>
        <Ring tone={tone} radius={radius} />
      </Billboard>
    );
  }
  return (
    <group rotation-x={-Math.PI / 2} {...props}>
      <Ring tone={tone} radius={radius} />
    </group>
  );
}
