import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLabStore } from "../../sim/labStore";
import { sceneRefs } from "../layout";

const MAX = 30;
const BOND = 0.03;
const dummy = new THREE.Object3D();
const p = new THREE.Vector3();
const offset = new THREE.Vector3();
const quat = new THREE.Quaternion();
const axis = new THREE.Vector3();

function bezier(a, b, c, t, out) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z
  );
}

export default function Co2Particles() {
  const carbon = useRef();
  const oxygen = useRef();
  const acc = useRef(0);
  const molecules = useMemo(
    () =>
      Array.from({ length: MAX }, () => ({
        alive: false,
        t: 0,
        speed: 0.3,
        start: new THREE.Vector3(),
        control: new THREE.Vector3(),
        leaf: 0,
        spin: new THREE.Vector3(1, 0, 0),
        phase: 0,
      })),
    []
  );

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const co2 = useLabStore.getState().inputs.co2;
    const leaves = sceneRefs.leafPoints;
    if (co2 > 2 && leaves.length) {
      acc.current += (co2 / 100) * 3.2 * dt;
      while (acc.current >= 1) {
        acc.current -= 1;
        const m = molecules.find((x) => !x.alive);
        if (!m) break;
        m.alive = true;
        m.t = 0;
        m.speed = 0.28 + Math.random() * 0.14;
        m.start.copy(sceneRefs.diffuser);
        m.leaf = Math.floor(Math.random() * leaves.length);
        const target = leaves[m.leaf];
        m.control.copy(m.start).lerp(target, 0.4).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.35 + Math.random() * 0.25, 0.15 + Math.random() * 0.25));
        m.spin.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        m.phase = Math.random() * Math.PI * 2;
      }
    }

    const time = clock.elapsedTime;
    molecules.forEach((m, i) => {
      if (m.alive) {
        m.t += m.speed * dt;
        if (m.t >= 1) m.alive = false;
      }
      if (!m.alive) {
        dummy.scale.setScalar(0.0001);
        dummy.position.set(0, -10, 0);
        dummy.updateMatrix();
        carbon.current.setMatrixAt(i, dummy.matrix);
        oxygen.current.setMatrixAt(i * 2, dummy.matrix);
        oxygen.current.setMatrixAt(i * 2 + 1, dummy.matrix);
        return;
      }
      bezier(m.start, m.control, leaves[m.leaf] || m.control, m.t, p);
      p.x += Math.sin(time * 2.3 + m.phase) * 0.015;
      p.y += Math.cos(time * 1.9 + m.phase) * 0.012;
      const s = Math.min(1, m.t / 0.08) * (m.t > 0.85 ? 1 - (m.t - 0.85) / 0.15 : 1);
      quat.setFromAxisAngle(m.spin, time * 1.5 + m.phase);
      dummy.quaternion.identity();
      dummy.position.copy(p);
      dummy.scale.setScalar(Math.max(s, 0.0001));
      dummy.updateMatrix();
      carbon.current.setMatrixAt(i, dummy.matrix);
      axis.set(1, 0, 0).applyQuaternion(quat);
      for (const k of [0, 1]) {
        offset.copy(axis).multiplyScalar((k ? 1 : -1) * BOND * s);
        dummy.position.copy(p).add(offset);
        dummy.updateMatrix();
        oxygen.current.setMatrixAt(i * 2 + k, dummy.matrix);
      }
    });
    carbon.current.instanceMatrix.needsUpdate = true;
    oxygen.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={carbon} args={[undefined, undefined, MAX]} frustumCulled={false} castShadow={false} raycast={() => null}>
        <sphereGeometry args={[0.019, 14, 10]} />
        <meshStandardMaterial color="#2b3036" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={oxygen} args={[undefined, undefined, MAX * 2]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[0.016, 14, 10]} />
        <meshStandardMaterial color="#e5484d" roughness={0.35} />
      </instancedMesh>
    </group>
  );
}
