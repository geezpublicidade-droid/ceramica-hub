"use client";

import { useEffect, useRef } from "react";

/* Tecido tramado (plain weave) tremulando como uma bandeira, desenhado num
   fragment shader. Paleta do site: terracota (trama principal), grafite e
   bege de apoio (contra-trama). Se WebGL não estiver disponível, o canvas
   fica vazio e o gradiente de fundo do container aparece. */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;

const vec3 TERRA = vec3(0.702, 0.333, 0.227);       // #b3553a
const vec3 TERRA_LIGHT = vec3(0.776, 0.502, 0.420); // #c6806b
const vec3 GRAPHITE = vec3(0.180, 0.180, 0.180);    // #2e2e2e
const vec3 BEIGE = vec3(0.863, 0.812, 0.761);       // #dccfc2

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uTime;

  // ondas de bandeira: amplitude cresce para o lado solto (direita)
  float amp = 0.07 + 0.09 * uv.x;
  float a1 = p.x * 3.2 - t * 1.6 + p.y * 2.0;
  float a2 = p.x * 5.7 - t * 1.1 - p.y * 3.1;
  float h = sin(a1) * amp + sin(a2) * amp * 0.4;
  float dhdx = cos(a1) * 3.2 * amp + cos(a2) * 5.7 * amp * 0.4;
  float dhdy = cos(a1) * 2.0 * amp - cos(a2) * 3.1 * amp * 0.4;

  // a trama acompanha a ondulação
  vec2 q = p + vec2(0.0, h);
  float density = 64.0;
  vec2 g = q * density;
  vec2 id = floor(g);
  vec2 f = fract(g);

  float warpProfile = sin(f.x * 3.14159);
  float weftProfile = sin(f.y * 3.14159);
  bool warpOnTop = mod(id.x + id.y, 2.0) < 0.5;

  // fios: vertical em terracota (tom varia por fio), horizontal em grafite
  // com um fio bege de vez em quando
  vec3 warpCol = mix(TERRA, TERRA_LIGHT, hash(vec2(id.x, 3.0)) * 0.55);
  vec3 weftCol = mix(GRAPHITE, BEIGE, step(0.93, hash(vec2(7.0, id.y))));
  weftCol = mix(weftCol, TERRA, step(0.85, hash(vec2(id.y, 11.0))) * 0.6);

  float profile = warpOnTop ? warpProfile : weftProfile;
  vec3 base = warpOnTop ? warpCol : weftCol;

  // relevo do fio + fibras finas
  float fiber = hash(floor(g * vec2(1.0, 6.0)) + id) * 0.12;
  float thread = 0.55 + 0.45 * pow(profile, 0.7) - fiber;
  // sombra de contato onde um fio passa por baixo do outro
  float edge = smoothstep(0.0, 0.18, warpOnTop ? f.x * (1.0 - f.x) : f.y * (1.0 - f.y));
  vec3 col = base * thread * (0.55 + 0.45 * edge);

  // iluminação pela dobra do tecido
  vec3 n = normalize(vec3(-dhdx * 0.9, -dhdy * 0.9, 1.0));
  vec3 l = normalize(vec3(-0.45, -0.55, 0.75));
  float diff = dot(n, l);
  float shade = 0.42 + 0.85 * diff;
  col *= shade;
  col += pow(max(diff, 0.0), 12.0) * 0.10; // brilho suave nas cristas

  // vinheta
  float vig = smoothstep(1.15, 0.25, length(uv - 0.5) * 1.25);
  col *= mix(0.55, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function WovenCloth({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (ms: number) => {
      resize();
      gl.uniform1f(uTime, ms / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (ms: number) => {
      if (!running) return;
      draw(ms);
      frame = requestAnimationFrame(loop);
    };

    if (reduceMotion.matches) {
      draw(2500); // quadro estático
      window.addEventListener("resize", () => draw(2500));
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
