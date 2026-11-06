import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sky } from "@react-three/drei";
import { useLabStore } from "../sim/labStore";
import { PLANT_CENTER, sceneRefs } from "./layout";

const WARM = new THREE.Color("#ff9a4d");
const NOON = new THREE.Color("#fff3dd");
const FOG_DIM = new THREE.Color("#46536a");
const FOG_BRIGHT = new THREE.Color("#c4dcea");
const tmp = new THREE.Vector3();

export default function SceneLighting() {
  const sun = useRef();
  const hemi = useRef();
  const fill = useRef();
  const sky = useRef();
  const eased = useRef(useLabStore.getState().inputs.light / 100);
  const scene = useThree((s) => s.scene);

  useFrame((_, dt) => {
    const target = useLabStore.getState().inputs.light / 100;
    const l = (eased.current = THREE.MathUtils.damp(eased.current, target, 4, dt));

    tmp.copy(sceneRefs.sunPosition).sub(PLANT_CENTER).normalize();
    sun.current.position.copy(PLANT_CENTER).addScaledVector(tmp, 9);
    sun.current.target.position.copy(PLANT_CENTER);
    sun.current.target.updateMatrixWorld();
    sun.current.intensity = 0.15 + 3.6 * l;
    sun.current.color.copy(WARM).lerp(NOON, Math.min(1, l * 1.4));

    hemi.current.intensity = 0.14 + 0.66 * l;
    fill.current.intensity = 0.2 + 0.4 * l;
    scene.environmentIntensity = 0.18 + 0.85 * l;
    if (scene.fog) scene.fog.color.copy(FOG_DIM).lerp(FOG_BRIGHT, l);

    if (sky.current) {
      const u = sky.current.material.uniforms;
      u.sunPosition.value.set(-0.55, THREE.MathUtils.lerp(-0.01, 0.75, Math.pow(l, 1.3)), -0.8).normalize();
      u.rayleigh.value = 2.8 - l * 1.8;
      u.turbidity.value = 9 - l * 5;
    }
  });

  return (
    <>
      <Sky ref={sky} distance={900} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <hemisphereLight ref={hemi} args={["#d6ecff", "#6b5a3e", 0.6]} />
      <directionalLight ref={fill} position={[2.5, 3, 6]} intensity={0.5} color="#dfe9ff" />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-3.2}
        shadow-camera-right={3.2}
        shadow-camera-top={3.2}
        shadow-camera-bottom={-3.2}
        shadow-camera-near={1}
        shadow-camera-far={22}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#cfe3ff" position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#fff1dc" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#a7c48a" position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="ring" intensity={4} color="#ffd8a3" position={[-4, 4, -5]} scale={2} />
      </Environment>
    </>
  );
}
