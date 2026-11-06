import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, SoftShadows, useGLTF } from "@react-three/drei";
import { Selection } from "@react-three/postprocessing";
import models from "../data/models.json";
import CameraRig from "./CameraRig";
import SceneLighting from "./SceneLighting";
import Effects from "./Effects";
import Greenhouse from "./props/Greenhouse";
import Bench from "./props/Bench";
import Pot from "./props/Pot";
import Soil from "./props/Soil";
import Plant from "./Plant";
import SunControl from "./interactive/SunControl";
import WateringCan from "./interactive/WateringCan";
import Co2Tank from "./interactive/Co2Tank";
import LightRays from "./effects/LightRays";
import WaterDrops from "./effects/WaterDrops";
import Co2Particles from "./effects/Co2Particles";
import O2Bubbles from "./effects/O2Bubbles";
import MicroWorld from "./micro/MicroWorld";
import { useLabStore } from "../sim/labStore";
import { worldFor } from "../sim/advancedSlice";

Object.values(models).forEach((m) => m.url && useGLTF.preload(m.url));

export default function LabCanvas() {
  const [dpr, setDpr] = useState(() => Math.min(1.5, window.devicePixelRatio || 1));
  const [quality, setQuality] = useState("high");
  const micro = useLabStore((s) => worldFor(s.stage) === "micro");

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [5.5, 4.6, 11], fov: 40, near: 0.05, far: 2000 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={(state) => {
        if (import.meta.env.DEV) window.__three = state;
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          setDpr(1);
          setQuality("low");
        }}
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio || 1))}
        onFallback={() => {
          setDpr(1);
          setQuality("low");
        }}
      />
      <AdaptiveDpr />
      <SoftShadows size={22} samples={quality === "high" ? 12 : 6} focus={0.6} />
      <CameraRig />
      <Suspense fallback={null}>
        <Selection>
          {micro ? (
            <MicroWorld />
          ) : (
            <>
              <fog attach="fog" args={["#c4dcea", 16, 45]} />
              <SceneLighting />
              <Greenhouse />
              <Bench />
              <Pot />
              <Soil />
              <Plant />
              <SunControl />
              <WateringCan />
              <Co2Tank />
              <LightRays />
              <WaterDrops />
              <Co2Particles />
              <O2Bubbles />
            </>
          )}
          <Effects quality={quality} />
        </Selection>
      </Suspense>
    </Canvas>
  );
}
