import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { useLabStore } from "../../sim/labStore";
import { SUN_ARC, lightToSunPosition, pointToLight, sceneRefs } from "../layout";
import { glowTexture } from "../textures";
import { useGrab } from "./useGrab";
import ObjectLabel from "./ObjectLabel";
import TargetRing, { useTargetTone } from "./TargetRing";

const DIM = new THREE.Color("#ff6a2a");
const BRIGHT = new THREE.Color("#fff3c8");
const target = new THREE.Vector3();
const hit = new THREE.Vector3();

export default function SunControl() {
  const group = useRef();
  const core = useRef();
  const halo = useRef();
  const eased = useRef(useLabStore.getState().inputs.light / 100);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -SUN_ARC.center.z), []);
  const selected = useLabStore((s) => s.selectedTool === "light" && (s.stage === "experiment" || s.stage === "apply"));
  const tone = useTargetTone("light");

  const { hovered, active, handlers } = useGrab("light", {
    onMove: (e) => {
      if (e.ray.intersectPlane(plane, hit)) useLabStore.getState().setInput("light", pointToLight(hit));
    },
  });

  const initialPosition = useMemo(() => lightToSunPosition(useLabStore.getState().inputs.light, new THREE.Vector3()), []);
  const arcPoints = useMemo(
    () => Array.from({ length: 41 }, (_, i) => lightToSunPosition((i / 40) * 100, new THREE.Vector3()).toArray()),
    []
  );

  useFrame((_, dt) => {
    const light = useLabStore.getState().inputs.light;
    lightToSunPosition(light, target);
    const pos = group.current.position;
    if (active.current) pos.copy(target);
    else {
      pos.x = THREE.MathUtils.damp(pos.x, target.x, 6, dt);
      pos.y = THREE.MathUtils.damp(pos.y, target.y, 6, dt);
      pos.z = target.z;
    }
    sceneRefs.sunPosition.copy(pos);
    const l = (eased.current = THREE.MathUtils.damp(eased.current, light / 100, 5, dt));
    core.current.material.color.copy(DIM).lerp(BRIGHT, l).multiplyScalar(1.4 + l * 3.2);
    halo.current.scale.setScalar(1.3 + l * 2.2);
    halo.current.material.opacity = 0.35 + l * 0.55;
    halo.current.material.color.copy(DIM).lerp(BRIGHT, l);
  });

  const showArc = hovered || selected || tone === "marker";

  return (
    <>
      <Line points={arcPoints} color="#fde68a" lineWidth={2} dashed dashSize={0.12} gapSize={0.1} transparent opacity={showArc ? 0.75 : 0.18} />
      <group ref={group} position={initialPosition}>
        <Select enabled={hovered}>
          <mesh ref={core} {...handlers}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
        </Select>
        <mesh {...handlers}>
          <sphereGeometry args={[0.62, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <sprite ref={halo} raycast={() => null}>
          <spriteMaterial map={glowTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
        <TargetRing variable="light" billboard radius={0.6} />
        <ObjectLabel variable="light" label="☀ Sun" hint="Drag along the arc" position={[0, -0.62, 0]} hovered={hovered} />
      </group>
    </>
  );
}
