"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* Bandeira de tecido simulada (Verlet) em Three.js -- a frase vai impressa na
   própria textura, então ondula junto com o pano. Adaptado do componente
   "woven-cloth" (lumina-weavers) pra rodar direto num canvas: o original
   vinha num iframe que carregava three/gsap/tailwind de CDN, o que a CSP do
   site (script-src 'self') bloquearia. */

export type WovenClothLabels = {
  badge: string;
  monogram?: string;
  lineOne: string;
  lineTwo: string;
  footer?: string;
};

type WovenClothProps = {
  labels: WovenClothLabels;
  className?: string;
};

const BW = 4.4;
const BH = 2.75;
const GX = 40;
const GY = 26;
const GRAV = -3.1;
const DAMP = 0.985;
const DT = 0.016;

// paleta do site: off-white de fundo, terracota no bordado
const GROUND = ["#f8f4ed", "#f2ece4", "#eadfd2"];
const TERRA = "#b3553a";
const TERRA_DARK = "#8a3d29";

function makeClothTexture(labels: WovenClothLabels) {
  const W = 1280;
  const H = 800;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return new THREE.CanvasTexture(c);

  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, GROUND[0]);
  g.addColorStop(0.5, GROUND[1]);
  g.addColorStop(1, GROUND[2]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  // bainha terracota
  x.strokeStyle = TERRA;
  x.lineWidth = 10;
  x.strokeRect(46, 46, W - 92, H - 92);
  x.lineWidth = 3;
  x.strokeStyle = TERRA_DARK;
  x.strokeRect(66, 66, W - 132, H - 132);

  x.textAlign = "center";
  x.textBaseline = "middle";

  x.fillStyle = TERRA;
  x.font = 'bold 74px Georgia, "Times New Roman", serif';
  x.fillText(labels.badge.toUpperCase(), W / 2, 190);

  x.font = 'normal 22px "Helvetica Neue", Arial, sans-serif';
  x.fillStyle = TERRA_DARK;
  x.fillText(labels.monogram ?? "· CERÂMICA HUB ·", W / 2, 246);

  x.fillStyle = TERRA;
  // encolhe a fonte até a linha caber dentro da bainha
  const fitFont = (text: string, size: number) => {
    x.font = `bold ${size}px Georgia, "Times New Roman", serif`;
    while (size > 40 && x.measureText(text).width > 960) {
      size -= 4;
      x.font = `bold ${size}px Georgia, "Times New Roman", serif`;
    }
  };
  fitFont(labels.lineOne, 96);
  x.fillText(labels.lineOne, W / 2, 400);
  fitFont(labels.lineTwo, 96);
  x.fillText(labels.lineTwo, W / 2, 520);

  x.fillStyle = TERRA_DARK;
  x.font = '600 28px "Helvetica Neue", Arial, sans-serif';
  x.fillText(labels.footer ?? "P A R K   ·   U N I O N   ·   W A Y   ·   G A T E", W / 2, 626);

  // trama fina + ruído de fibra
  for (let yy = 0; yy < H; yy += 3) {
    x.strokeStyle = "rgba(60,30,20,0.05)";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(0, yy + 0.5);
    x.lineTo(W, yy + 0.5);
    x.stroke();
  }
  for (let xx = 0; xx < W; xx += 3) {
    x.strokeStyle = "rgba(255,250,235,0.06)";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(xx + 0.5, 0);
    x.lineTo(xx + 0.5, H);
    x.stroke();
  }
  const img = x.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 2 - 1) * 10;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function WovenCloth({ labels, className }: WovenClothProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { badge, monogram, lineOne, lineTwo, footer } = labels;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return; // sem WebGL: o fundo do container aparece
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);
    const map = makeClothTexture({ badge, monogram, lineOne, lineTwo, footer });
    const mat = new THREE.MeshPhongMaterial({
      map,
      side: THREE.DoubleSide,
      shininess: 6,
      specular: 0x2a1410,
      color: 0xffffff,
    });
    scene.add(new THREE.Mesh(geo, mat));

    scene.add(new THREE.AmbientLight(0xffe9d0, 0.62));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.15);
    key.position.set(-3, 3.5, 3.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb3553a, 0.42);
    rim.position.set(3, -1.5, 2.0);
    scene.add(rim);

    // física Verlet: linha de cima presa, o resto pendurado ao vento
    const pos = geo.attributes.position;
    const N = (GX + 1) * (GY + 1);
    const cur = new Float32Array(N * 3);
    const prev = new Float32Array(N * 3);
    const rest = new Float32Array(N * 3);
    const pinned = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const ax = pos.getX(i);
      const ay = pos.getY(i);
      cur[i * 3] = prev[i * 3] = rest[i * 3] = ax;
      cur[i * 3 + 1] = prev[i * 3 + 1] = rest[i * 3 + 1] = ay;
    }
    for (let ix = 0; ix <= GX; ix++) pinned[ix] = 1;
    const idx = (ix: number, iy: number) => ix + iy * (GX + 1);
    const restH = BW / GX;
    const restV = BH / GY;

    const wind = (ix: number, iy: number, t: number): [number, number, number] => {
      const cx = ix / GX;
      const cy = iy / GY;
      const travel = t * 1.7 - cy * 4.2;
      const gust = 0.6 + 0.42 * Math.sin(t * 0.6) + 0.18 * Math.sin(t * 1.9 + 1.3);
      const amp = 4.3 * cy;
      const fz =
        (Math.sin(travel + cx * 3.3) + 0.5 * Math.sin(travel * 1.7 + cx * 6.0)) * amp * gust;
      const fx = Math.sin(t * 0.9 + cy * 2.2) * 0.6 * cy;
      const fy = -0.4 * cy;
      return [fx, fy, fz];
    };

    const solve = (a: number, b: number, rl: number) => {
      let dx = cur[b * 3] - cur[a * 3];
      let dy = cur[b * 3 + 1] - cur[a * 3 + 1];
      let dz = cur[b * 3 + 2] - cur[a * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const diff = ((dist - rl) / dist) * 0.5;
      dx *= diff;
      dy *= diff;
      dz *= diff;
      const pa = pinned[a];
      const pb = pinned[b];
      if (!pa && !pb) {
        cur[a * 3] += dx;
        cur[a * 3 + 1] += dy;
        cur[a * 3 + 2] += dz;
        cur[b * 3] -= dx;
        cur[b * 3 + 1] -= dy;
        cur[b * 3 + 2] -= dz;
      } else if (pa && !pb) {
        cur[b * 3] -= dx * 2;
        cur[b * 3 + 1] -= dy * 2;
        cur[b * 3 + 2] -= dz * 2;
      } else if (!pa && pb) {
        cur[a * 3] += dx * 2;
        cur[a * 3 + 1] += dy * 2;
        cur[a * 3 + 2] += dz * 2;
      }
    };

    const step = (t: number) => {
      for (let iy = 0; iy <= GY; iy++) {
        for (let ix = 0; ix <= GX; ix++) {
          const i = idx(ix, iy);
          if (pinned[i]) continue;
          const [fx, fy, fz] = wind(ix, iy, t);
          const acc = [fx, fy + GRAV, fz];
          for (let k = 0; k < 3; k++) {
            const j = i * 3 + k;
            const v = (cur[j] - prev[j]) * DAMP;
            prev[j] = cur[j];
            cur[j] = cur[j] + v + acc[k] * DT * DT;
          }
        }
      }
      for (let it = 0; it < 3; it++) {
        for (let iy = 0; iy <= GY; iy++) {
          for (let ix = 0; ix < GX; ix++) solve(idx(ix, iy), idx(ix + 1, iy), restH);
        }
        for (let iy = 0; iy < GY; iy++) {
          for (let ix = 0; ix <= GX; ix++) solve(idx(ix, iy), idx(ix, iy + 1), restV);
        }
      }
      for (let ix = 0; ix <= GX; ix++) {
        for (let k = 0; k < 3; k++) {
          cur[ix * 3 + k] = rest[ix * 3 + k];
          prev[ix * 3 + k] = rest[ix * 3 + k];
        }
      }
    };

    const commit = () => {
      for (let i = 0; i < N; i++) pos.setXYZ(i, cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]);
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };

    let camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const fit = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
      const vFit = BH / 2 / Math.tan((42 * Math.PI) / 360);
      const hFit = BW / 2 / Math.tan((42 * Math.PI) / 360) / aspect;
      camera.position.set(0, 0.05, Math.max(vFit, hFit) * 1.16 + 0.4);
      camera.lookAt(0, 0, 0);
    };
    fit();
    const observer = new ResizeObserver(() => {
      fit();
      renderer.render(scene, camera);
    });
    observer.observe(canvas);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = false;
    let raf = 0;
    let t = 0;
    const loop = () => {
      if (!running) return;
      t += DT;
      step(t);
      commit();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (reduce) {
      for (let s = 0; s < 220; s++) step(s * DT);
      commit();
      renderer.render(scene, camera);
    } else {
      for (let s = 0; s < 40; s++) step(s * DT);
      t = 40 * DT;
      start();
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geo.dispose();
      mat.dispose();
      map.dispose();
      renderer.dispose();
    };
  }, [badge, monogram, lineOne, lineTwo, footer]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
