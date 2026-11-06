import React, { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

class ModelBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn("Model failed to load, using fallback:", error?.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function normalizeModel(source, { size = [null, 1, null], rotation = [0, 0, 0], tint, material } = {}) {
  const root = new THREE.Group();
  const model = source.clone(true);
  const override = material ? new THREE.MeshStandardMaterial(material) : null;
  model.rotation.set(...rotation);
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (override) {
      o.material = override;
      return;
    }
    o.material = o.material.clone();
    const replacement = tint?.[o.material.name];
    if (replacement) o.material.color.set(replacement);
  });
  root.add(model);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const dims = box.getSize(new THREE.Vector3());
  const ratios = [dims.x, dims.y, dims.z].map((d, i) => (size[i] ? size[i] / d : null));
  const uniform = ratios.find((r) => r !== null) ?? 1;
  const scale = ratios.map((r) => r ?? uniform);
  const allSet = ratios.every((r) => r !== null);
  const s = allSet ? scale : [uniform, uniform, uniform];

  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= box.min.y;
  model.position.z -= center.z;
  const wrapper = new THREE.Group();
  wrapper.scale.set(...s);
  wrapper.add(root);
  const finalSize = new THREE.Vector3(dims.x * s[0], dims.y * s[1], dims.z * s[2]);
  return { object: wrapper, size: finalSize };
}

function Model({ url, options, onReady }) {
  const { scene } = useGLTF(url);
  const { object, size } = useMemo(() => normalizeModel(scene, options), [scene, options]);
  React.useEffect(() => onReady?.(size), [size, onReady]);
  return <primitive object={object} />;
}

export default function ModelOrFallback({ config, fallback, onReady }) {
  if (!config?.url) return fallback;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model url={config.url} options={config} onReady={onReady} />
      </Suspense>
    </ModelBoundary>
  );
}
