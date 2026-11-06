import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useLabStore } from "../../sim/labStore";
import { advance } from "../../sim/chloroplast";
import LeafSection from "./LeafSection";
import { ChloroplastModel, MesophyllCell } from "./CellLevels";
import TwoStageSystem from "./TwoStageSystem";

const BACKGROUND = ["#0b2b26", "#0d2a22", "#10261f", "#0c2224"];

function ChloroDriver() {
  const last = useRef(0);
  useFrame((state, dt) => {
    const s = useLabStore.getState();
    advance(s.chloroInputs, dt);
    if (state.clock.elapsedTime - last.current >= 0.1) {
      last.current = state.clock.elapsedTime;
      s.syncChloro();
    }
  });
  return null;
}

export default function MicroWorld() {
  const level = useLabStore((s) => s.zoomLevel);
  useEffect(() => () => (document.body.style.cursor = ""), []);

  return (
    <>
      <color attach="background" args={[BACKGROUND[level]]} />
      <ambientLight intensity={0.55} color="#d1fae5" />
      <hemisphereLight args={["#ecfccb", "#064e3b", 0.7]} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} color="#fffbeb" />
      <directionalLight position={[-5, -2, 3]} intensity={0.45} color="#99f6e4" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#a7f3d0" position={[-5, 0, 3]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#fde68a" position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
      </Environment>
      <Sparkles count={70} scale={[11, 6, 6]} size={2.2} speed={0.25} opacity={0.35} color="#bbf7d0" />
      {level === 0 && <LeafSection />}
      {level === 1 && <MesophyllCell />}
      {level === 2 && <ChloroplastModel />}
      {level === 3 && (
        <>
          <ChloroDriver />
          <TwoStageSystem />
        </>
      )}
    </>
  );
}
