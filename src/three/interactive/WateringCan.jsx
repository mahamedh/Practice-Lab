import React, { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import models from "../../data/models.json";
import { useLabStore } from "../../sim/labStore";
import ModelOrFallback from "../props/ModelOrFallback";
import { CAN_HOME, CAN_POUR, sceneRefs } from "../layout";
import { useGrab } from "./useGrab";
import ObjectLabel from "./ObjectLabel";
import TargetRing from "./TargetRing";

const PIVOT_Y = 0.15;
const FALLBACK_SPOUT = [-0.31, 0.25, 0];
const POUR_PER_SECOND = 26;

function CodeCan() {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3f8f6a", metalness: 0.55, roughness: 0.35 }), []);
  const handle = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.2, 0),
      new THREE.Vector3(0.06, 0.3, 0),
      new THREE.Vector3(0.14, 0.24, 0),
      new THREE.Vector3(0.11, 0.08, 0),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.012, 8, false);
  }, []);
  const spout = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.08, 0.05, 0), new THREE.Vector3(-0.2, 0.14, 0), new THREE.Vector3(-0.29, 0.24, 0)]);
    return new THREE.TubeGeometry(curve, 16, 0.013, 8, false);
  }, []);
  return (
    <group>
      <mesh position={[0, 0.1, 0]} material={metal} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.115, 0.2, 32]} />
      </mesh>
      <mesh position={[0, 0.205, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.02, 32]} />
      </mesh>
      <mesh geometry={handle} material={metal} castShadow />
      <mesh geometry={spout} material={metal} castShadow />
      <mesh position={[-0.3, 0.255, 0]} rotation-z={Math.PI / 2 + 0.75} material={metal} castShadow>
        <coneGeometry args={[0.03, 0.04, 16, 1, true]} />
      </mesh>
    </group>
  );
}

export default function WateringCan() {
  const group = useRef();
  const tiltGroup = useRef();
  const spoutAnchor = useRef();
  const tilt = useRef(0);
  const desiredTilt = useRef(0.75);
  const startY = useRef(0);
  const accumulated = useRef(0);
  const [spout, setSpout] = useState(FALLBACK_SPOUT);

  const { hovered, active, handlers } = useGrab("water", {
    onStart: (e) => {
      startY.current = e.clientY;
      desiredTilt.current = 0.8;
    },
    onMove: (e) => {
      desiredTilt.current = THREE.MathUtils.clamp(0.8 + (e.clientY - startY.current) * 0.004, 0.3, 1.25);
    },
    onEnd: () => {
      accumulated.current = 0;
    },
  });

  const onModelReady = useCallback((size) => {
    const f = models.wateringCan.spout;
    setSpout([f[0] * size.x, f[1] * size.y, f[2] * size.z]);
  }, []);

  useFrame((_, dt) => {
    const held = active.current;
    const goal = held ? CAN_POUR : CAN_HOME;
    const p = group.current.position;
    p.x = THREE.MathUtils.damp(p.x, goal.x, 6, dt);
    p.y = THREE.MathUtils.damp(p.y, goal.y, 6, dt);
    p.z = THREE.MathUtils.damp(p.z, goal.z, 6, dt);
    const arrived = p.distanceTo(CAN_POUR) < 0.1;
    tilt.current = THREE.MathUtils.damp(tilt.current, held && arrived ? desiredTilt.current : held ? 0.15 : 0, 5, dt);
    tiltGroup.current.rotation.z = tilt.current;

    spoutAnchor.current.getWorldPosition(sceneRefs.spoutTip);
    const rate = held && arrived ? THREE.MathUtils.clamp((tilt.current - 0.4) / 0.6, 0, 1) : 0;
    sceneRefs.pourRate = rate;
    if (rate > 0) {
      accumulated.current += rate * POUR_PER_SECOND * dt;
      if (accumulated.current >= 1) {
        const step = Math.floor(accumulated.current);
        accumulated.current -= step;
        const s = useLabStore.getState();
        s.setInput("water", s.inputs.water + step);
      }
    }
  });

  return (
    <group ref={group} position={CAN_HOME.toArray()}>
      <group ref={tiltGroup} position={[0, PIVOT_Y, 0]}>
        <group position={[0, -PIVOT_Y, 0]}>
          <Select enabled={hovered}>
            <group {...handlers}>
              <ModelOrFallback config={models.wateringCan} fallback={<CodeCan />} onReady={onModelReady} />
              <mesh position={[-0.05, 0.15, 0]}>
                <boxGeometry args={[0.55, 0.36, 0.3]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          </Select>
          <object3D ref={spoutAnchor} position={spout} />
        </group>
      </group>
      <TargetRing variable="water" only="marker" radius={0.24} position={[0, 0.01, 0]} />
      <ObjectLabel variable="water" label="💧 Water" hint="Hold to pour · drag down to tip more" position={[0, 0.46, 0]} hovered={hovered} />
    </group>
  );
}
