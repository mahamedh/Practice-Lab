import React, { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import models from "../../data/models.json";
import { useLabStore } from "../../sim/labStore";
import ModelOrFallback from "../props/ModelOrFallback";
import { DIFFUSER_POSITION, TANK_HEIGHT, TANK_POSITION } from "../layout";
import { labelTexture } from "../textures";
import { useGrab } from "./useGrab";
import ObjectLabel from "./ObjectLabel";
import TargetRing from "./TargetRing";

const noRaycast = () => null;

function CodeTank() {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5f7787", metalness: 0.6, roughness: 0.35 }), []);
  return (
    <group>
      <mesh position={[0, (TANK_HEIGHT - 0.15) / 2, 0]} material={steel} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, TANK_HEIGHT - 0.15, 32]} />
      </mesh>
      <mesh position={[0, TANK_HEIGHT - 0.15, 0]} scale={[1, 0.85, 1]} material={steel} castShadow>
        <sphereGeometry args={[0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

function Hose({ from }) {
  const geometry = useMemo(() => {
    const a = from.clone();
    const b = DIFFUSER_POSITION.clone().add(new THREE.Vector3(-0.04, 0.03, 0));
    const curve = new THREE.CatmullRomCurve3([
      a,
      a.clone().add(new THREE.Vector3(0.05, 0.12, 0)),
      new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.12, (a.z + b.z) / 2),
      b.clone().add(new THREE.Vector3(-0.08, 0.06, 0)),
      b,
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.012, 8, false);
  }, [from]);
  return (
    <mesh geometry={geometry} castShadow raycast={noRaycast}>
      <meshStandardMaterial color="#2f3640" roughness={0.6} />
    </mesh>
  );
}

function Diffuser() {
  return (
    <group position={DIFFUSER_POSITION.toArray()}>
      <mesh position={[0, 0.015, 0]} castShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 24]} />
        <meshStandardMaterial color="#3b4652" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.018, 0.024, 0.05, 16]} />
        <meshStandardMaterial color="#9aa7b3" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Co2Tank() {
  const wheel = useRef();
  const needle = useRef();
  const startX = useRef(0);
  const startValue = useRef(0);
  const [top, setTop] = useState(TANK_HEIGHT);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9a14a", metalness: 0.8, roughness: 0.3 }), []);
  const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d63c3c", metalness: 0.2, roughness: 0.45 }), []);
  const label = useMemo(() => labelTexture("CO₂", { bg: "#e2e8f0", fg: "#0f172a" }), []);

  const { hovered, handlers } = useGrab("co2", {
    onStart: (e) => {
      startX.current = e.clientX;
      startValue.current = useLabStore.getState().inputs.co2;
    },
    onMove: (e) => {
      useLabStore.getState().setInput("co2", startValue.current + (e.clientX - startX.current) * 0.3);
    },
  });

  const onModelReady = useCallback((size) => setTop(size.y), []);

  useFrame((_, dt) => {
    const c = useLabStore.getState().inputs.co2 / 100;
    wheel.current.rotation.y = THREE.MathUtils.damp(wheel.current.rotation.y, -c * Math.PI * 1.6, 8, dt);
    needle.current.rotation.z = THREE.MathUtils.damp(needle.current.rotation.z, THREE.MathUtils.lerp(2.3, -2.3, c), 8, dt);
  });

  const outlet = useMemo(() => new THREE.Vector3(TANK_POSITION.x + 0.06, top + 0.06, TANK_POSITION.z), [top]);

  return (
    <group>
      <group position={TANK_POSITION.toArray()}>
        <ModelOrFallback config={models.co2Tank} fallback={<CodeTank />} onReady={onModelReady} />
        <mesh position={[0, top * 0.55, 0.152]} raycast={noRaycast}>
          <planeGeometry args={[0.2, 0.075]} />
          <meshStandardMaterial map={label} roughness={0.6} />
        </mesh>

        <group position={[0, top, 0]}>
          <mesh position={[0, 0.03, 0]} material={brass} castShadow raycast={noRaycast}>
            <cylinderGeometry args={[0.035, 0.04, 0.06, 16]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} material={brass} castShadow raycast={noRaycast}>
            <boxGeometry args={[0.08, 0.05, 0.07]} />
          </mesh>
          <group position={[0, 0.085, 0.05]}>
            <mesh rotation-x={Math.PI / 2} raycast={noRaycast}>
              <cylinderGeometry args={[0.045, 0.045, 0.02, 32]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            <group ref={needle} position={[0, 0, 0.012]}>
              <mesh position={[0, 0.018, 0]} raycast={noRaycast}>
                <boxGeometry args={[0.005, 0.036, 0.003]} />
                <meshBasicMaterial color="#dc2626" />
              </mesh>
            </group>
          </group>

          <Select enabled={hovered}>
            <group ref={wheel} position={[0, 0.14, 0]} {...handlers}>
              <mesh rotation-x={Math.PI / 2} material={red} castShadow>
                <torusGeometry args={[0.085, 0.016, 12, 40]} />
              </mesh>
              {[0, 1, 2].map((i) => (
                <mesh key={i} rotation-y={(i * Math.PI) / 3} material={red} castShadow>
                  <boxGeometry args={[0.17, 0.014, 0.018]} />
                </mesh>
              ))}
              <mesh material={red}>
                <cylinderGeometry args={[0.022, 0.022, 0.03, 16]} />
              </mesh>
            </group>
          </Select>
          <mesh position={[0, 0.12, 0]} {...handlers}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <ObjectLabel variable="co2" label="CO₂ valve" hint="Drag sideways to turn" position={[0, 0.36, 0]} hovered={hovered} />
        </group>
        <TargetRing variable="co2" radius={0.3} position={[0, 0.02, 0]} />
      </group>
      <Hose from={outlet} />
      <Diffuser />
    </group>
  );
}
