import * as THREE from "three";

export const BENCH_TOP = 0.82;
export const POT_HEIGHT = 0.5;
export const POT_RADIUS = 0.3;
export const SOIL_Y = BENCH_TOP + 0.45;
export const SOIL_RADIUS = 0.265;
export const PLANT_CENTER = new THREE.Vector3(0, SOIL_Y + 0.55, 0);

export const CAN_HOME = new THREE.Vector3(0.72, BENCH_TOP, 0.12);
export const CAN_POUR = new THREE.Vector3(0.42, SOIL_Y + 0.3, 0.04);

export const TANK_POSITION = new THREE.Vector3(-1.32, 0, -0.2);
export const TANK_HEIGHT = 1.18;
export const DIFFUSER_POSITION = new THREE.Vector3(-0.42, BENCH_TOP, 0.18);

export const SUN_ARC = {
  center: new THREE.Vector3(-0.2, 0.9, -3.4),
  radius: 3.0,
  min: THREE.MathUtils.degToRad(10),
  max: THREE.MathUtils.degToRad(80),
};

export function lightToSunPosition(light, target = new THREE.Vector3()) {
  const phi = SUN_ARC.min + (SUN_ARC.max - SUN_ARC.min) * (light / 100);
  return target.set(SUN_ARC.center.x - SUN_ARC.radius * Math.cos(phi), SUN_ARC.center.y + SUN_ARC.radius * Math.sin(phi), SUN_ARC.center.z);
}

export function pointToLight(point) {
  const phi = Math.atan2(point.y - SUN_ARC.center.y, -(point.x - SUN_ARC.center.x));
  const clamped = THREE.MathUtils.clamp(phi, SUN_ARC.min, SUN_ARC.max);
  return ((clamped - SUN_ARC.min) / (SUN_ARC.max - SUN_ARC.min)) * 100;
}

export const sceneRefs = {
  sunPosition: lightToSunPosition(20),
  spoutTip: new THREE.Vector3(),
  spoutDirection: new THREE.Vector3(-1, 0, 0),
  pourRate: 0,
  diffuser: DIFFUSER_POSITION.clone().add(new THREE.Vector3(0, 0.07, 0)),
  leafPoints: [],
  health: 0.2,
  moisture: 0.8,
};
