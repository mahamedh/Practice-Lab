import React, { Suspense, useEffect } from "react";
import { useLabStore } from "../sim/labStore";
import { worldFor } from "../sim/advancedSlice";
import { toggleFullscreen } from "./fullscreen";
import TopBar from "./hud/TopBar";
import BottomDock from "./hud/BottomDock";
import MicroDock from "./hud/MicroDock";
import MicroNav from "./hud/MicroNav";
import ReactionStrip from "./hud/ReactionStrip";
import TransitionOverlay from "./hud/TransitionOverlay";
import GuideBubble from "./hud/GuideBubble";
import ChangeToast from "./hud/ChangeToast";
import HypothesisColumn from "./hud/HypothesisCard";
import Notebook from "./hud/Notebook";
import ScenarioBanner from "./hud/ScenarioBanner";
import MissionIntro from "./stages/MissionIntro";
import PredictSketch from "./stages/PredictSketch";
import ExplainPanel from "./stages/ExplainPanel";
import ApplyWhyPanel from "./stages/ApplyWhyPanel";
import ZoomPanel from "./stages/ZoomPanel";
import ChallengePanel from "./stages/ChallengePanel";
import LabSheet from "./stages/LabSheet";
import MasteryReport from "./stages/MasteryReport";
import { DragLayer } from "./stages/drag";

const LabCanvas = React.lazy(() => import("../three/LabCanvas"));
const LoadingOverlay = React.lazy(() => import("./LoadingOverlay"));

export function prefetchLab() {
  import("../three/LabCanvas");
  import("./LoadingOverlay");
}

const PRESENTER_STAGES = { 1: "predict", 2: "experiment", 3: "zoom", 4: "explain", 5: "apply", 6: "challenge", 7: "report" };

function usePresenterKeys() {
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "TEXTAREA" || (tag === "INPUT" && e.target.type !== "range") || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useLabStore.getState();
      if (PRESENTER_STAGES[e.key]) s.goToStage(PRESENTER_STAGES[e.key]);
      else if (e.key === "r" || e.key === "R") s.resetScenario();
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "n" || e.key === "N") s.toggleNotebook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export default function LabShell() {
  const open = useLabStore((s) => s.open);
  const stage = useLabStore((s) => s.stage);
  const micro = useLabStore((s) => worldFor(s.stage) === "micro");
  const systemView = useLabStore((s) => worldFor(s.stage) === "micro" && s.zoomLevel === 3);
  const sheetOpen = useLabStore((s) => s.sheet.open);
  usePresenterKeys();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;
  const showDock = stage !== "intro" && stage !== "mastery" && stage !== "report";

  return (
    <div className="lab-shell fixed inset-0 z-[100] h-[100dvh] w-screen select-none overflow-hidden bg-slate-950 font-sans text-white">
      <Suspense fallback={<div className="absolute inset-0 bg-slate-950" />}>
        <LabCanvas />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <TopBar />
        {systemView && (
          <div className="mt-2 px-5">
            <ReactionStrip />
          </div>
        )}
        <div className="mt-3">
          <ChangeToast />
        </div>

        <div className="relative flex min-h-0 flex-1">
          {micro && (
            <div className="absolute left-5 top-1">
              <MicroNav />
            </div>
          )}
          <div className="pointer-events-none absolute right-5 top-2">
            <HypothesisColumn />
          </div>
          {stage === "intro" && <MissionIntro />}
          {stage === "predict" && <PredictSketch />}
          {stage === "zoom" && <ZoomPanel />}
          {stage === "explain" && <ExplainPanel />}
          {stage === "apply" && <ApplyWhyPanel />}
          {stage === "challenge" && <ChallengePanel />}
          {stage === "mastery" && <MasteryReport />}
        </div>

        {showDock && (
          <div className="space-y-3 px-4 pb-4">
            <GuideBubble />
            {micro ? <MicroDock /> : <BottomDock />}
          </div>
        )}
        {(stage === "intro" || stage === "report") && <div className="h-6" />}
      </div>

      {(stage === "report" || sheetOpen) && <LabSheet />}
      <TransitionOverlay />
      <ScenarioBanner />
      <Notebook />
      <DragLayer />
      <Suspense fallback={null}>
        <LoadingOverlay />
      </Suspense>
    </div>
  );
}
