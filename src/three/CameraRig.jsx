import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { CameraControls } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import { useLabStore } from "../sim/labStore";
import { worldFor } from "../sim/advancedSlice";
import { PLANT_CENTER, sceneRefs } from "./layout";

const VIEWS = {
  start: [5.5, 4.6, 11, 0, 1.4, 0],
  intro: [2.3, 2.15, 4.4, 0.35, 1.65, 0],
  overview: [0.55, 2.2, 4.35, -0.2, 1.68, 0],
  panel: [1.25, 2.15, 4.3, 0.7, 1.68, 0],
  light: [0.6, 2.35, 5.6, -0.9, 2.05, -1],
  water: [1.75, 2.0, 2.95, 0.55, 1.28, 0.1],
  co2: [-0.3, 1.95, 3.1, -0.95, 1.3, -0.05],
  mastery: [-0.3, 2.05, 3.7, -0.9, 1.7, 0],
};

const MICRO_VIEWS = [
  [1.25, 2.6, 8.6, 1.25, -0.4, 0],
  [1.05, 0.9, 7.4, 1.05, -0.3, 0],
  [1.0, 1.1, 7.2, 1.0, -0.3, 0],
  [1.45, 1.1, 12.8, 1.45, 0.1, 0],
];

function viewFor(stage, focus) {
  if (stage === "intro") return VIEWS.intro;
  if (stage === "predict" || stage === "explain" || stage === "report") return VIEWS.panel;
  if (stage === "mastery") return VIEWS.mastery;
  return VIEWS[focus] || VIEWS.overview;
}

const tmp = new THREE.Vector3();

export default function CameraRig() {
  const ref = useRef();
  const setControls = useLabStore((s) => s.setControls);
  const stage = useLabStore((s) => s.stage);
  const focusNonce = useLabStore((s) => s.focusNonce);
  const dragging = useLabStore((s) => s.dragging);
  const zoomLevel = useLabStore((s) => s.zoomLevel);
  const transition = useLabStore((s) => s.transition);
  const micro = worldFor(stage) === "micro";

  useEffect(() => {
    const controls = ref.current;
    setControls(controls);
    const { ACTION } = CameraControlsImpl;
    controls.mouseButtons.right = ACTION.NONE;
    controls.mouseButtons.middle = ACTION.NONE;
    controls.touches.two = ACTION.TOUCH_DOLLY;
    controls.touches.three = ACTION.NONE;
    controls.setLookAt(...VIEWS.start, false);
    controls.smoothTime = 0.9;
    controls.setLookAt(...VIEWS.intro, true).then(() => {
      controls.smoothTime = 0.45;
    });
    return () => setControls(null);
  }, [setControls]);

  useEffect(() => {
    if (ref.current) ref.current.enabled = !dragging;
  }, [dragging]);

  useEffect(() => {
    const controls = ref.current;
    if (!controls || micro) return;
    const { cameraFocus } = useLabStore.getState();
    controls.minDistance = 1.6;
    controls.smoothTime = 0.45;
    controls.setLookAt(...viewFor(stage, cameraFocus), true);
  }, [stage, focusNonce, micro]);

  useEffect(() => {
    const controls = ref.current;
    if (!controls || !micro) return;
    const v = MICRO_VIEWS[zoomLevel];
    const k = 0.45;
    controls.minDistance = 1.6;
    controls.smoothTime = 0.55;
    controls.setLookAt(v[3] + (v[0] - v[3]) * k, v[4] + (v[1] - v[4]) * k, v[5] + (v[2] - v[5]) * k, v[3], v[4], v[5], false);
    controls.setLookAt(...v, true);
  }, [micro, zoomLevel]);

  useEffect(() => {
    const controls = ref.current;
    if (!controls || transition?.phase !== "in") return;
    if (transition.kind === "dive") {
      const leaf = sceneRefs.leafPoints[3] ?? PLANT_CENTER;
      tmp.copy(leaf);
      controls.minDistance = 0.2;
      controls.smoothTime = 0.5;
      controls.setLookAt(tmp.x + 0.18, tmp.y + 0.08, tmp.z + 0.35, tmp.x, tmp.y, tmp.z, true);
    } else if (transition.kind === "zoom") {
      controls.smoothTime = 0.35;
      controls.dolly(controls.distance * 0.55, true);
    }
  }, [transition]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.6}
      maxDistance={14}
      minPolarAngle={0.35}
      maxPolarAngle={1.5}
      minAzimuthAngle={-1.05}
      maxAzimuthAngle={1.05}
      dollySpeed={0.6}
    />
  );
}
