import * as THREE from "three";

const cache = new Map();

function canvasTexture(key, width, height, draw, { color = true, repeat } = {}) {
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function leafTexture() {
  return canvasTexture("leaf", 512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c9d8b6");
    g.addColorStop(0.5, "#f4f8ec");
    g.addColorStop(1, "#c9d8b6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const rand = seeded(7);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "120,150,100"},${0.05 + rand() * 0.06})`;
      ctx.fillRect(rand() * w, rand() * h, 2, 2);
    }
    ctx.strokeStyle = "rgba(255,255,240,0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "rgba(255,255,235,0.6)";
    for (let i = 1; i < 11; i++) {
      const x = (i / 11) * w;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x - 20, h / 2);
        ctx.quadraticCurveTo(x + 18, h / 2 + dir * h * 0.22, x + 46, h / 2 + dir * h * 0.48);
        ctx.stroke();
      }
    }
  });
}

export function soilTexture() {
  return canvasTexture("soil", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const rand = seeded(11);
    for (let i = 0; i < 5000; i++) {
      const v = Math.floor(150 + rand() * 105);
      ctx.fillStyle = `rgba(${v},${v - 10},${v - 25},${0.35 + rand() * 0.5})`;
      const s = 1 + rand() * 3;
      ctx.fillRect(rand() * w, rand() * h, s, s);
    }
  }, { repeat: [2, 2] });
}

export function crackTexture() {
  return canvasTexture("cracks", 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const rand = seeded(23);
    ctx.strokeStyle = "rgba(35,20,10,0.95)";
    ctx.lineCap = "round";
    for (let i = 0; i < 22; i++) {
      let x = w / 2 + (rand() - 0.5) * w * 0.7;
      let y = h / 2 + (rand() - 0.5) * h * 0.7;
      let angle = rand() * Math.PI * 2;
      ctx.lineWidth = 4 + rand() * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 9; j++) {
        angle += (rand() - 0.5) * 1.1;
        x += Math.cos(angle) * 22;
        y += Math.sin(angle) * 22;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export function woodTexture() {
  return canvasTexture("wood", 512, 128, (ctx, w, h) => {
    ctx.fillStyle = "#e7c9a0";
    ctx.fillRect(0, 0, w, h);
    const rand = seeded(5);
    for (let i = 0; i < 70; i++) {
      const y = rand() * h;
      ctx.strokeStyle = `rgba(120,75,40,${0.08 + rand() * 0.18})`;
      ctx.lineWidth = 0.6 + rand() * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.5);
      ctx.stroke();
    }
  });
}

export function glowTexture() {
  return canvasTexture("glow", 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(0.6, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function labelTexture(text, { bg = "#1e293b", fg = "#ffffff" } = {}) {
  return canvasTexture(`label-${text}-${bg}`, 256, 96, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = "bold 54px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}
