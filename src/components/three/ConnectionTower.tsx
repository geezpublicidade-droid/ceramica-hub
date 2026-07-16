import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { FLOOR_COUNT, FLOOR_HEIGHT, TOWER_RADIUS } from "./towerLayout";

const totalHeight = FLOOR_COUNT * FLOOR_HEIGHT;

export function ConnectionTower() {
  const slabsRef = useRef<THREE.InstancedMesh>(null);

  // objeto de trabalho mutável — não é estado de render, por isso é um ref e
  // não um valor memoizado (que o React trata como imutável).
  const dummyRef = useRef<THREE.Object3D | null>(null);
  if (dummyRef.current == null) dummyRef.current = new THREE.Object3D();

  useLayoutEffect(() => {
    const mesh = slabsRef.current;
    const dummy = dummyRef.current;
    if (!mesh || !dummy) return;

    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
      const y = floor * FLOOR_HEIGHT - totalHeight / 2;
      dummy.position.set(0, y, 0);
      dummy.rotation.y = floor * 0.12;
      dummy.updateMatrix();
      mesh.setMatrixAt(floor, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* coluna central — espinha estrutural da torre */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, totalHeight, 16]} />
        <meshStandardMaterial color="#0a0d12" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* lajes de cada andar — módulos de vidro fosco */}
      <instancedMesh ref={slabsRef} args={[undefined, undefined, FLOOR_COUNT]}>
        <cylinderGeometry args={[TOWER_RADIUS + 0.35, TOWER_RADIUS + 0.35, 0.06, 24, 1, true]} />
        <meshStandardMaterial
          color="#0e1420"
          transparent
          opacity={0.22}
          metalness={0.1}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
