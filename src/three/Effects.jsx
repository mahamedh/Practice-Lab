import React from "react";
import { Bloom, EffectComposer, Outline, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export default function Effects({ quality }) {
  const high = quality === "high";
  return (
    <EffectComposer multisampling={high ? 4 : 0} disableNormalPass>
      <Outline blur visibleEdgeColor={0xffffff} hiddenEdgeColor={0x9ad7ff} edgeStrength={4} width={1200} />
      <Bloom mipmapBlur intensity={high ? 0.75 : 0.5} luminanceThreshold={1} luminanceSmoothing={0.2} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
