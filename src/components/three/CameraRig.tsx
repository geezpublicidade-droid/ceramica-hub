import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useScrollProgress } from "@/components/motion/ScrollStage";

type Keyframe = {
  progress: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

/**
 * Cena 1 (0.00): entrada — plano aberto, estático.
 * Cena 2 (0.25): câmera se aproxima e sobe entre os andares.
 * Cena 3 (0.50): leve deslocamento, tensão da desconexão.
 * Cena 4 (0.75→1.0): recuo progressivo revelando a rede inteira conectada.
 */
function buildKeyframes(): Keyframe[] {
  return [
    { progress: 0, position: new THREE.Vector3(0, 1.2, 11), lookAt: new THREE.Vector3(0, 1, 0) },
    { progress: 0.25, position: new THREE.Vector3(2.5, 3.5, 7), lookAt: new THREE.Vector3(0, 2, 0) },
    { progress: 0.5, position: new THREE.Vector3(-2, 1, 6.5), lookAt: new THREE.Vector3(0, 1.5, 0) },
    { progress: 0.75, position: new THREE.Vector3(0, 4.5, 9), lookAt: new THREE.Vector3(0, 3, 0) },
    { progress: 1, position: new THREE.Vector3(0, 2, 13), lookAt: new THREE.Vector3(0, 3.5, 0) },
  ];
}

function sampleKeyframes(
  keyframes: Keyframe[],
  progress: number,
  outPosition: THREE.Vector3,
  outLookAt: THREE.Vector3
) {
  let segment = keyframes[keyframes.length - 2];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].progress && progress <= keyframes[i + 1].progress) {
      segment = keyframes[i];
      break;
    }
  }
  const index = keyframes.indexOf(segment);
  const a = keyframes[index];
  const b = keyframes[index + 1];
  const span = b.progress - a.progress;
  const t = span === 0 ? 0 : (progress - a.progress) / span;

  outPosition.lerpVectors(a.position, b.position, t);
  outLookAt.lerpVectors(a.lookAt, b.lookAt, t);
}

/** damping independente de frame-rate — suaviza sem depender de física real */
function damp(current: THREE.Vector3, target: THREE.Vector3, lambda: number, delta: number) {
  current.lerp(target, 1 - Math.exp(-lambda * delta));
}

export function CameraRig() {
  const progressRef = useScrollProgress();
  const keyframes = useMemo(() => buildKeyframes(), []);
  // vetores de trabalho mutáveis a cada frame — refs, não memoização.
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    sampleKeyframes(keyframes, progressRef.current, targetPosition.current, targetLookAt.current);
    damp(state.camera.position, targetPosition.current, 3, delta);
    damp(currentLookAt.current, targetLookAt.current, 3, delta);
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
}
