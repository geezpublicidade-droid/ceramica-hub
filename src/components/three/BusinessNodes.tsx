import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildNodePositions, NODE_COUNT } from "./towerLayout";
import { useScrollProgress } from "@/components/motion/ScrollStage";

const INACTIVE_COLOR = new THREE.Color("#1c2430");
const ACTIVE_COLOR = new THREE.Color("#5ac8fa");
/** os nós terminam de acender lá pelo meio do scroll (fim das Cenas 1-2) */
const ACTIVATION_END = 0.55;
const ACTIVATION_WIDTH = 0.16;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function BusinessNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useScrollProgress();
  const nodes = useMemo(() => buildNodePositions(), []);

  // objetos de trabalho mutáveis — refs, não valores memoizados (imutáveis).
  const dummyRef = useRef<THREE.Object3D | null>(null);
  if (dummyRef.current == null) dummyRef.current = new THREE.Object3D();
  const tmpColorRef = useRef<THREE.Color | null>(null);
  if (tmpColorRef.current == null) tmpColorRef.current = new THREE.Color();

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    if (!mesh || !dummy) return;

    nodes.forEach((node, index) => {
      dummy.position.copy(node.position);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, INACTIVE_COLOR);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  useFrame(() => {
    const mesh = meshRef.current;
    const dummy = dummyRef.current;
    const tmpColor = tmpColorRef.current;
    if (!mesh || !dummy || !tmpColor) return;

    const progress = progressRef.current;
    let changed = false;

    nodes.forEach((node, index) => {
      const threshold = node.activationOrder * ACTIVATION_END;
      const activation = clamp01((progress - threshold + ACTIVATION_WIDTH / 2) / ACTIVATION_WIDTH);

      tmpColor.copy(INACTIVE_COLOR).lerp(ACTIVE_COLOR, activation);
      mesh.setColorAt(index, tmpColor);

      const scale = 1 + activation * 0.5;
      dummy.position.copy(node.position);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      changed = true;
    });

    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, NODE_COUNT]}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
