import React, { useMemo } from "react";
import * as THREE from "three";
import { soilTexture } from "../textures";

const W = 5.2;
const BACK = -2.2;
const FRONT = 2.0;
const DEPTH = FRONT - BACK;
const WALL = 2.5;
const RIDGE = 3.4;
const noRaycast = () => null;

function Beam({ from, to, size = 0.05, material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
      length: dir.length(),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion} material={material} castShadow raycast={noRaycast}>
      <boxGeometry args={[size, length, size]} />
    </mesh>
  );
}

function Tree({ position, scale = 1, color = "#4f7a3a" }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.12, 0.18, 1.8, 8]} />
        <meshStandardMaterial color="#6b4a32" roughness={1} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow raycast={noRaycast}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.5, 2.0, 0.3]} castShadow raycast={noRaycast}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Seedling({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.08, 0]} castShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.09, 0.07, 0.16, 16]} />
        <meshStandardMaterial color="#b0613b" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.3) * 0.05, 0.22 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.05]} rotation={[0.5, i * 1.3, 0.3]} castShadow raycast={noRaycast}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#5c9a43" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function Greenhouse() {
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9eef2", metalness: 0.55, roughness: 0.35 }), []);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e3f4ff",
        transparent: true,
        opacity: 0.08,
        roughness: 0.06,
        metalness: 0,
        envMapIntensity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const gravel = useMemo(() => {
    const map = soilTexture().clone();
    map.repeat.set(6, 5);
    map.needsUpdate = true;
    return map;
  }, []);

  const slope = Math.hypot(W / 2, RIDGE - WALL);
  const slopeAngle = Math.atan2(RIDGE - WALL, W / 2);
  const gable = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo(W / 2, 0);
    shape.lineTo(0, RIDGE - WALL);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  const xs = [-W / 2, -W / 4, 0, W / 4, W / 2];
  const zs = [BACK, (BACK + FRONT) / 2, FRONT];

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow raycast={noRaycast}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#6f9150" roughness={1} />
      </mesh>
      <mesh position={[0, -0.01, (BACK + FRONT) / 2]} receiveShadow raycast={noRaycast}>
        <boxGeometry args={[W + 0.3, 0.04, DEPTH + 0.3]} />
        <meshStandardMaterial color="#b8b0a2" map={gravel} roughness={0.95} />
      </mesh>

      {[
        [-9, 0, -20, 1.7],
        [-4, 0, -25, 2.1],
        [2.5, 0, -27, 2.4],
        [8, 0, -21, 1.8],
        [13, 0, -14, 1.6],
        [-14, 0, -12, 1.7],
        [-15, 0, -3, 1.4],
        [15, 0, -2, 1.5],
      ].map(([x, y, z, s], i) => (
        <Tree key={i} position={[x, y, z]} scale={s} color={i % 2 ? "#4b7536" : "#5d8a41"} />
      ))}

      {xs.map((x) => (
        <Beam key={`back-${x}`} from={[x, 0, BACK]} to={[x, WALL + (W / 2 - Math.abs(x)) * ((RIDGE - WALL) / (W / 2)), BACK]} material={frame} />
      ))}
      {[-W / 2, W / 2].flatMap((x) =>
        zs.map((z) => <Beam key={`side-${x}-${z}`} from={[x, 0, z]} to={[x, WALL, z]} material={frame} size={0.06} />)
      )}
      {zs.map((z) => (
        <React.Fragment key={`rafter-${z}`}>
          <Beam from={[-W / 2, WALL, z]} to={[0, RIDGE, z]} material={frame} />
          <Beam from={[W / 2, WALL, z]} to={[0, RIDGE, z]} material={frame} />
        </React.Fragment>
      ))}
      <Beam from={[0, RIDGE, BACK]} to={[0, RIDGE, FRONT]} material={frame} size={0.06} />
      {[-W / 2, W / 2].map((x) => (
        <React.Fragment key={`eave-${x}`}>
          <Beam from={[x, WALL, BACK]} to={[x, WALL, FRONT]} material={frame} />
          <Beam from={[x, 1.0, BACK]} to={[x, 1.0, FRONT]} material={frame} size={0.035} />
        </React.Fragment>
      ))}
      <Beam from={[-W / 2, WALL, BACK]} to={[W / 2, WALL, BACK]} material={frame} />
      <Beam from={[-W / 2, 1.0, BACK]} to={[W / 2, 1.0, BACK]} material={frame} size={0.035} />

      <mesh position={[0, WALL / 2, BACK]} material={glass} raycast={noRaycast}>
        <planeGeometry args={[W, WALL]} />
      </mesh>
      <mesh position={[0, WALL, BACK]} geometry={gable} material={glass} raycast={noRaycast} />
      {[-1, 1].map((side) => (
        <React.Fragment key={side}>
          <mesh position={[(side * W) / 2, WALL / 2, (BACK + FRONT) / 2]} rotation-y={Math.PI / 2} material={glass} raycast={noRaycast}>
            <planeGeometry args={[DEPTH, WALL]} />
          </mesh>
          <mesh
            position={[(side * W) / 4, (WALL + RIDGE) / 2, (BACK + FRONT) / 2]}
            rotation={[-Math.PI / 2, 0, -side * slopeAngle, "ZYX"]}
            material={glass}
            raycast={noRaycast}
          >
            <planeGeometry args={[slope, DEPTH]} />
          </mesh>
        </React.Fragment>
      ))}

      <group position={[0, 0, BACK + 0.32]}>
        {[-1.9, 1.9].map((x) => (
          <mesh key={x} position={[x, 0.36, 0]} castShadow receiveShadow raycast={noRaycast}>
            <boxGeometry args={[0.05, 0.72, 0.4]} />
            <meshStandardMaterial color="#7a5638" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow raycast={noRaycast}>
          <boxGeometry args={[3.9, 0.04, 0.42]} />
          <meshStandardMaterial color="#9a7048" roughness={0.8} />
        </mesh>
        {[-1.6, -1.05, -0.5, 0.55, 1.1, 1.65].map((x, i) => (
          <Seedling key={x} position={[x, 0.74, (i % 2) * 0.08 - 0.04]} scale={0.9 + (i % 3) * 0.12} />
        ))}
      </group>
    </group>
  );
}
