import { useEffect, useState } from "react";

export function enterFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return;
  el.requestFullscreen().catch(() => {});
}

export function exitFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}

export function toggleFullscreen() {
  if (document.fullscreenElement) exitFullscreen();
  else enterFullscreen();
}

export function useIsFullscreen() {
  const [value, setValue] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const onChange = () => setValue(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  return value;
}
