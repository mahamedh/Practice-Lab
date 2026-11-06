import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BENCH_TOP, SOIL_RADIUS, SOIL_Y, sceneRefs } from "../layout";

const MAX = 360;
const GRAVITY = 9.8;
const UP = new THREE.Vector3(0, 1, 0);
const dummy = new THREE.Object3D();
const vel = new THREE.Vector3();

export default function WaterDrops() {
  const mesh = useRef();
  const spawnAcc = useRef(0);
  const state = useMemo(
    () => ({
      pos: new Float32Array(MAX * 3),
      vel: new Float32Array(MAX * 3),
      life: new Float32Array(MAX),
      splash: new Uint8Array(MAX),
      next: 0,
    }),
    []
  );

  const spawn = (x, y, z, vx, vy, vz, life, splash) => {
    const i = state.next;
    state.next = (state.next + 1) % MAX;
    state.pos.set([x, y, z], i * 3);
    state.vel.set([vx, vy, vz], i * 3);
    state.life[i] = life;
    state.splash[i] = splash ? 1 : 0;
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const rate = sceneRefs.pourRate;
    if (rate > 0) {
      spawnAcc.current += rate * 240 * dt;
      const tip = sceneRefs.spoutTip;
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1;
        const j = () => (Math.random() - 0.5) * 0.02;
        spawn(tip.x + j(), tip.y + j(), tip.z + j(), -0.45 - Math.random() * 0.35 * rate, -0.1 + Math.random() * 0.1, (Math.random() - 0.5) * 0.18, 2, false);
      }
    }

    for (let i = 0; i < MAX; i++) {
      if (state.life[i] <= 0) {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const o = i * 3;
      state.life[i] -= dt;
      state.vel[o + 1] -= GRAVITY * dt * (state.splash[i] ? 0.6 : 1);
      state.pos[o] += state.vel[o] * dt;
      state.pos[o + 1] += state.vel[o + 1] * dt;
      state.pos[o + 2] += state.vel[o + 2] * dt;
      const x = state.pos[o];
      const y = state.pos[o + 1];
      const z = state.pos[o + 2];
      const onSoil = Math.hypot(x, z) < SOIL_RADIUS && y < SOIL_Y + 0.02 && state.vel[o + 1] < 0;
      if (!state.splash[i] && onSoil) {
        state.life[i] = 0;
        if (Math.random() < 0.6) {
          for (let k = 0; k < 2; k++) {
            const a = Math.random() * Math.PI * 2;
            spawn(x, SOIL_Y + 0.02, z, Math.cos(a) * 0.35, 0.6 + Math.random() * 0.4, Math.sin(a) * 0.35, 0.22, true);
          }
        }
        continue;
      }
      if (y < BENCH_TOP - 0.05 || (state.splash[i] && y < SOIL_Y)) {
        state.life[i] = 0;
        continue;
      }
      vel.set(state.vel[o], state.vel[o + 1], state.vel[o + 2]);
      const speed = vel.length();
      dummy.position.set(x, y, z);
      dummy.quaternion.setFromUnitVectors(UP, vel.normalize());
      const s = state.splash[i] ? 0.6 : 1;
      dummy.scale.set(s, s * (1 + Math.min(speed, 3) * 0.7), s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[0.0075, 8, 6]} />
      <meshStandardMaterial color="#b8e6ff" emissive="#2f8fd6" emissiveIntensity={0.35} roughness={0.05} transparent opacity={0.8} />
    </instancedMesh>
  );
}
