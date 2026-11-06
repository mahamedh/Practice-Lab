import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Hand } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import { useLabStore } from "../../sim/labStore";
import { enterFullscreen } from "../fullscreen";
import { Eyebrow, Panel, PrimaryButton } from "../ui";

export default function MissionIntro() {
  const startMission = useLabStore((s) => s.startMission);
  const { mission } = scenarios;
  return (
    <div className="pointer-events-none flex h-full w-full items-center px-8">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>
        <Panel className="w-[420px] p-7">
          <Eyebrow>{mission.eyebrow}</Eyebrow>
          <h1 className="mt-3 text-4xl font-bold leading-tight">{mission.title}</h1>
          <p className="mt-3 text-base leading-7 text-white/75">{mission.body}</p>
          <PrimaryButton
            className="mt-6 w-full py-3 text-base"
            onClick={() => {
              enterFullscreen();
              startMission();
            }}
          >
            {mission.start} <ArrowRight size={18} />
          </PrimaryButton>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
            <Hand size={14} /> {mission.inspectHint}
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
