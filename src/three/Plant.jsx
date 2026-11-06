import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLabStore } from "../sim/labStore";
import { SOIL_Y, sceneRefs } from "./layout";
import { leafTexture } from "./textures";

const SEGMENTS = 7;
const SEG_LEN = 0.15;
const NODES = [
  { len: 0.44, width: 0.25, yaw: 0 },
  { len: 0.43, width: 0.245, yaw: Math.PI / 2 + 0.2 },
  { len: 0.41, width: 0.235, yaw: 0.4 },
  { len: 0.38, width: 0.22, yaw: Math.PI / 2 + 0.6 },
  { len: 0.34, width: 0.2, yaw: 0.8 },
  { len: 0.28, width: 0.17, yaw: Math.PI / 2 + 1.0 },
  { len: 0.2, width: 0.12, yaw: 1.2 },
];
const LEAF_COUNT = NODES.length * 2;

const SICK_LEAF = new THREE.Color("#b9a74c");
const HEALTHY_LEAF = new THREE.Color("#3d9934");
const SICK_STEM = new THREE.Color("#8c8442");
const HEALTHY_STEM = new THREE.Color("#4f8f37");

function makeLeafGeometry(len, width) {
  const g = new THREE.PlaneGeometry(1, 1, 20, 8);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5;
    const v = pos.getY(i) * 2;
    let w;
    if (u < 0.1) w = 0.06;
    else {
      const t = (u - 0.1) / 0.9;
      w = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.6) * (1 - 0.12 * t);
    }
    const halfWidth = (w * width) / 2;
    const x = u * len;
    const z = v * halfWidth;
    const y = -0.16 * len * u * u + Math.abs(v) * halfWidth * 0.35;
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, u, (v + 1) / 2);
  }
  g.computeVertexNormals();
  return g;
}

function smoothstep(a, b, x) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function Plant() {
  const root = useRef();
  const segRefs = useRef([]);
  const leafRefs = useRef([]);
  const anchors = useRef([]);
  const scenario = useRef(useLabStore.getState().scenarioId);
  const health = useRef(useLabStore.getState().activity / 100);

  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: leafTexture(), side: THREE.DoubleSide, roughness: 0.55, color: SICK_LEAF.clone() }),
    []
  );
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6, color: SICK_STEM.clone() }), []);
  const geos = useMemo(
    () => ({
      stem: Array.from({ length: SEGMENTS }, (_, i) => {
        const r0 = 0.032 - i * 0.0028;
        const g = new THREE.CylinderGeometry(r0 - 0.0028, r0, SEG_LEN + 0.004, 10);
        g.translate(0, SEG_LEN / 2, 0);
        return g;
      }),
      leaf: NODES.map((n) => makeLeafGeometry(n.len, n.width)),
    }),
    []
  );

  if (sceneRefs.leafPoints.length !== LEAF_COUNT) {
    sceneRefs.leafPoints = Array.from({ length: LEAF_COUNT }, () => new THREE.Vector3(0, SOIL_Y + 0.5, 0));
  }

  useFrame(({ clock }, dt) => {
    const s = useLabStore.getState();
    const target = s.activity / 100;
    if (scenario.current !== s.scenarioId) {
      scenario.current = s.scenarioId;
      health.current = target;
    }
    health.current = THREE.MathUtils.damp(health.current, target, 0.9, dt);
    sceneRefs.health = health.current;
    const v = smoothstep(0.1, 0.75, health.current);
    const droop = 1 - v;
    const t = clock.elapsedTime;

    for (let i = 0; i < SEGMENTS; i++) {
      const seg = segRefs.current[i];
      if (!seg) continue;
      const sway = Math.sin(t * 1.1 + i * 0.6) * 0.012 * (1 + i * 0.25);
      seg.rotation.z = -droop * (0.05 + i * 0.022) + sway;
      seg.rotation.x = droop * 0.03 + Math.sin(t * 0.8 + i) * 0.006;
    }
    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = leafRefs.current[i];
      if (!leaf) continue;
      const node = Math.floor(i / 2);
      const healthyPitch = 0.42 - node * 0.02;
      const wiltPitch = -0.95 + node * 0.08;
      const flutter = Math.sin(t * 2.1 + i * 1.7) * 0.03;
      leaf.rotation.z = THREE.MathUtils.lerp(wiltPitch, healthyPitch, v) + flutter;
      leaf.rotation.x = Math.sin(t * 1.4 + i) * 0.04 + droop * (i % 2 ? 0.25 : -0.25);
      const scale = 0.82 + 0.18 * v;
      leaf.scale.set(scale, scale, scale * (0.8 + 0.2 * v));
      anchors.current[i]?.getWorldPosition(sceneRefs.leafPoints[i]);
    }
    leafMat.color.copy(SICK_LEAF).lerp(HEALTHY_LEAF, v);
    stemMat.color.copy(SICK_STEM).lerp(HEALTHY_STEM, v);
    root.current.scale.setScalar(0.93 + 0.07 * v);
  });

  const build = (i) => {
    const node = NODES[i];
    return (
      <group key={i} ref={(el) => (segRefs.current[i] = el)} position={[0, i === 0 ? 0 : SEG_LEN, 0]}>
        <mesh geometry={geos.stem[i]} material={stemMat} castShadow raycast={() => null} />
        {[0, 1].map((k) => {
          const idx = i * 2 + k;
          return (
            <group key={k} position={[0, SEG_LEN * 0.9, 0]} rotation-y={node.yaw + k * Math.PI}>
              <group ref={(el) => (leafRefs.current[idx] = el)}>
                <mesh geometry={geos.leaf[i]} material={leafMat} castShadow receiveShadow raycast={() => null} />
                <object3D ref={(el) => (anchors.current[idx] = el)} position={[node.len * 0.62, 0, 0]} />
              </group>
            </group>
          );
        })}
        {i === SEGMENTS - 1 ? (
          <mesh position={[0, SEG_LEN + 0.02, 0]} material={leafMat} castShadow raycast={() => null}>
            <sphereGeometry args={[0.028, 12, 10]} />
          </mesh>
        ) : (
          build(i + 1)
        )}
      </group>
    );
  };

  return (
    <group ref={root} position={[0, SOIL_Y + 0.01, 0]}>
      {build(0)}
    </group>
  );
}
