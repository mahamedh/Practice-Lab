import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLabStore } from "../../sim/labStore";
import { sceneRefs } from "../layout";

const MAX = 60;
const LIFE = 2.8;
const BOND = 0.024;
const dummy = new THREE.Object3D();
const axis = new THREE.Vector3();

export default function O2Bubbles() {
  const mesh = useRef();
  const acc = useRef(0);
  const bubbles = useMemo(
    () =>
      Array.from({ length: MAX }, () => ({
        alive: false,
        age: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        phase: 0,
        tilt: 0,
      })),
    []
  );

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const activity = useLabStore.getState().activity;
    const leaves = sceneRefs.leafPoints;
    if (activity > 2 && leaves.length) {
      acc.current += Math.pow(activity / 100, 1.2) * 9 * dt;
      while (acc.current >= 1) {
        acc.current -= 1;
        const b = bubbles.find((x) => !x.alive);
        if (!b) break;
        b.alive = true;
        b.age = 0;
        b.pos.copy(leaves[Math.floor(Math.random() * leaves.length)]).add(new THREE.Vector3((Math.random() - 0.5) * 0.06, 0.02, (Math.random() - 0.5) * 0.06));
        b.vel.set((Math.random() - 0.5) * 0.08, 0.22 + Math.random() * 0.12, 0.04 + Math.random() * 0.06);
        b.phase = Math.random() * Math.PI * 2;
        b.tilt = Math.random() * Math.PI;
      }
    }

    const time = clock.elapsedTime;
    bubbles.forEach((b, i) => {
      if (b.alive) {
        b.age += dt;
        if (b.age > LIFE) b.alive = false;
      }
      if (!b.alive) {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i * 2, dummy.matrix);
        mesh.current.setMatrixAt(i * 2 + 1, dummy.matrix);
        return;
      }
      b.pos.addScaledVector(b.vel, dt);
      b.pos.x += Math.sin(time * 3 + b.phase) * 0.003;
      const k = b.age / LIFE;
      const s = Math.min(1, k / 0.1) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
      const angle = time * 1.2 + b.tilt;
      axis.set(Math.cos(angle), Math.sin(angle) * 0.3, Math.sin(angle)).normalize().multiplyScalar(BOND * s);
      for (const side of [0, 1]) {
        dummy.position.copy(b.pos).addScaledVector(axis, side ? 1 : -1);
        dummy.scale.setScalar(Math.max(s, 0.0001));
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i * 2 + side, dummy.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX * 2]} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[0.024, 14, 10]} />
      <meshStandardMaterial color="#d9f6ff" emissive="#7dd3fc" emissiveIntensity={0.9} roughness={0.2} transparent opacity={0.92} />
    </instancedMesh>
  );
}
