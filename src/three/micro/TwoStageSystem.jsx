import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { chloroRuntime } from "../../sim/chloroplast";
import { Flow, MAT, Pickable, Tag } from "./parts";

const S = chapter.zoom.structures;
export const STACK = [-1.35, 0, 0];
export const CYCLE = [1.3, 0, 0];
const SUN = [-3.05, 1.7, 0.2];
const STOMA = [2.85, 2.0, 0.3];
const VEIN = [-2.7, -2.0, 0.5];

const out = () => chloroRuntime.out;
const flowRate = (key, k = 3) => () => (out()[key] / 100) * k;

function tracerWindow(id, from, to) {
  return () => {
    const tr = useLabStore.getState().tracer;
    if (!tr || tr.id !== id) return false;
    const e = chloroRuntime.t - tr.t0;
    return e >= from && e <= to;
  };
}

function ThylakoidStack({ challenge }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#22c55e", roughness: 0.35, emissive: "#22c55e", emissiveIntensity: 0.5 }), []);
  const lumen = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9f99d", roughness: 0.6 }), []);
  useFrame((_, dt) => {
    const target = 0.15 + (out().lightRate / 100) * 1.6;
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, 4, Math.min(dt, 0.05));
  });
  return (
    <Pickable id="thylakoid" enabled={challenge} position={STACK}>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, (i - 2.5) * 0.15, 0]}>
          <mesh material={mat}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 40, 1, false, 0, Math.PI * 1.6]} />
          </mesh>
          <mesh material={lumen}>
            <cylinderGeometry args={[0.49, 0.49, 0.05, 32, 1, false, Math.PI * 1.6, Math.PI * 0.4]} />
          </mesh>
        </group>
      ))}
    </Pickable>
  );
}

function CalvinCycle({ challenge }) {
  const beads = useRef();
  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a855f7", roughness: 0.3, emissive: "#7e22ce", emissiveIntensity: 0.6 }), []);
  useFrame((_, dt) => {
    const k = out().sugar / 100;
    if (beads.current) beads.current.rotation.z -= Math.min(dt, 0.05) * (0.15 + 2.2 * k);
    ringMat.emissiveIntensity = THREE.MathUtils.damp(ringMat.emissiveIntensity, 0.15 + k * 1.4, 4, Math.min(dt, 0.05));
  });
  return (
    <Pickable id="stroma" enabled={challenge} position={CYCLE}>
      <mesh material={ringMat}>
        <torusGeometry args={[0.62, 0.065, 16, 64]} />
      </mesh>
      <group ref={beads}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]}>
              <sphereGeometry args={[0.085, 16, 12]} />
              <meshStandardMaterial color="#e9d5ff" emissive="#c084fc" emissiveIntensity={0.8} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
      <mesh>
        <circleGeometry args={[0.55, 40]} />
        <meshBasicMaterial color="#581c87" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </Pickable>
  );
}

function Sun() {
  const core = useRef();
  const beam = useRef();
  useFrame((_, dt) => {
    const l = useLabStore.getState().chloroInputs.light / 100;
    const d = Math.min(dt, 0.05);
    core.current.material.color.setRGB(1, 0.85, 0.4).multiplyScalar(0.25 + 3 * l);
    beam.current.material.opacity = THREE.MathUtils.damp(beam.current.material.opacity, 0.03 + 0.22 * l, 5, d);
    core.current.scale.setScalar(THREE.MathUtils.damp(core.current.scale.x, 0.6 + 0.4 * l, 5, d));
  });
  const { mid, len, rot } = useMemo(() => {
    const a = new THREE.Vector3(...SUN);
    const b = new THREE.Vector3(...STACK).add(new THREE.Vector3(0, 0.4, 0));
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: a.clone().add(b).multiplyScalar(0.5), len: dir.length(), rot: new THREE.Euler().setFromQuaternion(q) };
  }, []);
  return (
    <group>
      <mesh ref={core} position={SUN}>
        <sphereGeometry args={[0.32, 32, 24]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={mid} rotation={rot}>
        <cylinderGeometry args={[0.55, 0.12, len, 32, 1, true]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Stoma({ challenge }) {
  const left = useRef();
  const right = useRef();
  useFrame((_, dt) => {
    const open = useLabStore.getState().chloroInputs.co2 > 10 ? 1 : 0;
    const d = Math.min(dt, 0.05);
    left.current.position.x = THREE.MathUtils.damp(left.current.position.x, -0.07 - 0.07 * open, 5, d);
    right.current.position.x = THREE.MathUtils.damp(right.current.position.x, 0.07 + 0.07 * open, 5, d);
  });
  return (
    <Pickable id="stoma" enabled={challenge} position={STOMA} rotation={[0.5, 0, -0.6]}>
      {[left, right].map((ref, i) => (
        <mesh key={i} ref={ref} position={[i ? 0.14 : -0.14, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.32, 8, 16]} />
          <meshStandardMaterial color="#4ade80" roughness={0.4} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial color="#bef264" roughness={0.8} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </Pickable>
  );
}

function Vein({ challenge }) {
  return (
    <Pickable id="water" enabled={challenge} position={VEIN} rotation={[0, 0, 0.5]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 1.1, 20]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} transparent opacity={0.8} />
      </mesh>
    </Pickable>
  );
}

const PILE = Array.from({ length: 10 }, (_, i) => [0.42 + (i % 4) * 0.13, 0.62 + Math.floor(i / 4) * 0.12, 0.35 + (i % 2) * 0.08]);

function EnergyPile() {
  const refs = useRef([]);
  useFrame(() => {
    const n = Math.max(0, Math.min(PILE.length, Math.round((out().atp - 58) / 3.6)));
    refs.current.forEach((m, i) => m && (m.visible = i < n));
  });
  return (
    <group>
      {PILE.map((p, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={p} material={i % 2 ? MAT.nadph : MAT.atp} visible={false}>
          <sphereGeometry args={[0.055, 14, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export default function TwoStageSystem() {
  const challenge = useLabStore((s) => s.stage === "challenge");
  const hSource = useLabStore((s) => s.chloroInputs.hSource);
  const sulfur = hSource === "H2S";
  const tracer = useLabStore((s) => s.tracer);
  const isotopeTask = useLabStore((s) => s.stage === "zoom" && s.atoms.hypothesis && !(s.atoms.runs.h2o18 && s.atoms.runs.co2_18));

  const labels = useMemo(
    () => ({
      h2oIn: tracerWindow("h2o18", 0, 2.6),
      o2Out: tracerWindow("h2o18", 1.3, 5),
      co2In: tracerWindow("co2_18", 0, 2.6),
      sugarOut: tracerWindow("co2_18", 1.5, 5),
      waterOut: tracerWindow("co2_18", 1.5, 5),
    }),
    [],
  );

  return (
    <group>
      <mesh scale={[3.25, 1.7, 1.15]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial color="#4ade80" roughness={0.3} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh scale={[3.33, 1.78, 1.2]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial color="#86efac" roughness={0.3} transparent opacity={0.08} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      <Sun />
      <ThylakoidStack challenge={challenge} />
      <CalvinCycle challenge={challenge} />
      <Stoma challenge={challenge} />
      <Vein challenge={challenge} />
      <EnergyPile />

      {/* Light reactions: H2O in, O2 out (or H2S in, S out) */}
      <Flow
        points={[VEIN, [-2.15, -1.2, 0.4], [-1.55, -0.55, 0.3]]}
        kind={sulfur ? "h2s" : "h2o"}
        rate={flowRate("lightRate", 3.6)}
        duration={2}
        labelled={labels.h2oIn}
        origin="h2o"
      />
      {sulfur ? (
        <Flow points={[[-1.0, -0.45, 0.45], [-0.75, -1.1, 0.8], [-0.6, -1.75, 0.95]]} kind="s" rate={flowRate("s", 3)} duration={2.2} />
      ) : (
        <Flow points={[[-1.55, 0.5, 0.3], [-2.05, 1.2, 0.45], [-2.35, 2.0, 0.6]]} kind="o2" rate={flowRate("o2", 3)} duration={2.2} labelled={labels.o2Out} origin="h2o" />
      )}

      {/* ATP and NADPH to the Calvin cycle; ADP and NADP+ back */}
      <Flow points={[[-0.8, 0.4, 0.1], [0, 0.78, 0.2], [0.72, 0.42, 0.1]]} kind="atp" rate={flowRate("sugar", 2.6)} duration={1.6} max={10} />
      <Flow points={[[-0.8, 0.3, -0.15], [0, 0.66, -0.1], [0.72, 0.3, -0.15]]} kind="nadph" rate={flowRate("sugar", 2.2)} duration={1.7} max={10} />
      <Flow points={[[0.72, -0.4, 0.1], [0, -0.78, 0.2], [-0.8, -0.42, 0.1]]} kind="adp" rate={flowRate("sugar", 2.6)} duration={1.6} max={10} />
      <Flow points={[[0.72, -0.3, -0.15], [0, -0.66, -0.1], [-0.8, -0.32, -0.15]]} kind="nadp" rate={flowRate("sugar", 2.2)} duration={1.7} max={10} />

      {/* Calvin cycle: CO2 in, sugar and water out */}
      <Flow points={[STOMA, [2.25, 1.15, 0.3], [1.5, 0.6, 0.15]]} kind="co2" rate={flowRate("sugar", 3.4)} duration={1.8} labelled={labels.co2In} origin="co2" />
      <Flow points={[[1.35, -0.62, 0.2], [1.85, -1.3, 0.4], [2.45, -1.95, 0.6]]} kind="sugar" rate={flowRate("sugar", 1.8)} duration={2.2} labelled={labels.sugarOut} origin="co2" />
      <Flow points={[[1.95, 0.05, 0.2], [2.4, -0.35, 0.45], [2.85, -0.65, 0.6]]} kind="h2o" rate={flowRate("sugar", 1.4)} duration={1.8} labelled={labels.waterOut} origin="co2" scale={0.85} />

      <Tag position={[STACK[0], 0.85, 0.35]} tone="green">{S.thylakoid} · Light reactions</Tag>
      <Tag position={[CYCLE[0], 0.95, 0.35]} tone="violet">{S.stroma} · Calvin cycle</Tag>
      <Tag position={[0, 1.02, 0.25]} small tone="amber" dot="#22d3ee">ATP · NADPH</Tag>
      <Tag position={[0, -1.02, 0.25]} small tone="slate">ADP · NADP⁺</Tag>
      <Tag position={[SUN[0], SUN[1] + 0.55, SUN[2]]} small tone="amber">Light</Tag>
      <Tag position={[VEIN[0] + 0.15, VEIN[1] - 0.45, VEIN[2]]} tone="sky" drop={isotopeTask && !sulfur ? "H2O" : undefined}>
        {sulfur ? "H₂S" : "H₂O"}
      </Tag>
      <Tag position={[STOMA[0], STOMA[1] + 0.5, STOMA[2]]} tone="slate" drop={isotopeTask ? "CO2" : undefined}>
        CO₂ · {S.stoma.toLowerCase()}
      </Tag>
      {sulfur ? (
        <Tag position={[-0.6, -2.05, 0.95]} small tone="amber" dot="#facc15">S globules</Tag>
      ) : (
        <Tag position={[-1.7, 2.1, 0.6]} small tone="red" dot="#fecaca">{S.o2out}</Tag>
      )}
      <Tag position={[2.5, -2.25, 0.6]} small tone="amber" dot="#f59e0b">Sugar [CH₂O]</Tag>
      <Tag position={[3.05, -0.85, 0.6]} small>H₂O formed</Tag>
      {tracer && (
        <Tag position={[0, 1.55, 0.4]} tone="green" dot="#bbf7d0">
          Tracing ¹⁸O from {tracer.target === "H2O" ? "H₂O" : "CO₂"}…
        </Tag>
      )}
    </group>
  );
}
