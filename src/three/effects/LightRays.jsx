import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLabStore } from "../../sim/labStore";
import { sceneRefs } from "../layout";

const MAX_BEAMS = 8;
const PHOTONS_PER_BEAM = 3;
const UP = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const tmp = new THREE.Vector3();
const dummy = new THREE.Object3D();

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float edge = pow(abs(dot(vNormal, vView)), 2.0);
    float along = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
    float streak = 0.6 + 0.4 * sin(vUv.y * 26.0 - uTime * 5.0);
    float a = edge * along * streak * uIntensity * 0.5;
    gl_FragColor = vec4(uColor * (0.8 + uIntensity), a);
  }
`;

export default function LightRays() {
  const beams = useRef([]);
  const photons = useRef();
  const intensities = useRef(new Array(MAX_BEAMS).fill(0));

  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.11, 0.035, 1, 20, 1, true);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const materials = useMemo(
    () =>
      Array.from(
        { length: MAX_BEAMS },
        () =>
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uColor: { value: new THREE.Color("#ffe7a3") } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            toneMapped: false,
          })
      ),
    []
  );
  const photonMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.1), toneMapped: false }), []);

  useFrame(({ clock }, dt) => {
    const light = useLabStore.getState().inputs.light;
    const l = light / 100;
    const count = light < 3 ? 0 : 1 + Math.round(l * (MAX_BEAMS - 1));
    const leaves = sceneRefs.leafPoints;
    const t = clock.elapsedTime;

    for (let i = 0; i < MAX_BEAMS; i++) {
      const mesh = beams.current[i];
      if (!mesh || !leaves.length) continue;
      const target = leaves[(i * 5 + 3) % leaves.length];
      intensities.current[i] = THREE.MathUtils.damp(intensities.current[i], i < count ? 0.45 + 0.55 * l : 0, 4, dt);
      const intensity = intensities.current[i];
      mesh.visible = intensity > 0.01;
      dir.copy(target).sub(sceneRefs.sunPosition);
      const length = dir.length();
      mesh.position.copy(sceneRefs.sunPosition);
      mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
      mesh.scale.set(1, length, 1);
      materials[i].uniforms.uTime.value = t + i * 0.37;
      materials[i].uniforms.uIntensity.value = intensity;

      for (let k = 0; k < PHOTONS_PER_BEAM; k++) {
        const idx = i * PHOTONS_PER_BEAM + k;
        const p = (t * (0.35 + 0.25 * l) + k / PHOTONS_PER_BEAM + i * 0.13) % 1;
        tmp.copy(sceneRefs.sunPosition).lerp(target, p);
        dummy.position.copy(tmp);
        dummy.scale.setScalar(intensity > 0.05 ? (0.6 + 0.6 * intensity) * Math.sin(Math.PI * p) : 0.0001);
        dummy.updateMatrix();
        photons.current.setMatrixAt(idx, dummy.matrix);
      }
    }
    if (photons.current) photons.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {materials.map((m, i) => (
        <mesh key={i} ref={(el) => (beams.current[i] = el)} geometry={geometry} material={m} frustumCulled={false} raycast={() => null} />
      ))}
      <instancedMesh ref={photons} args={[undefined, undefined, MAX_BEAMS * PHOTONS_PER_BEAM]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <primitive object={photonMaterial} attach="material" />
      </instancedMesh>
    </group>
  );
}
