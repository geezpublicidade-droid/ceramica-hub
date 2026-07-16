import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildConnections, buildNodePositions } from "./towerLayout";
import { useScrollProgress } from "@/components/motion/ScrollStage";

/** as conexões só começam a se desenhar na Cena 4 */
const CONNECTIONS_START = 0.58;
const CONNECTIONS_END = 0.98;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ConnectionLines() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const progressRef = useScrollProgress();

  const { geometry, segmentCount } = useMemo(() => {
    const nodes = buildNodePositions();
    const connections = buildConnections(nodes).sort((a, b) => a.order - b.order);

    const positions = new Float32Array(connections.length * 2 * 3);
    connections.forEach((connection, index) => {
      const from = nodes[connection.from].position;
      const to = nodes[connection.to].position;
      positions.set([from.x, from.y, from.z, to.x, to.y, to.z], index * 6);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);

    return { geometry: geo, segmentCount: connections.length };
  }, []);

  useFrame(() => {
    const progress = progressRef.current;
    const connectionProgress = clamp01((progress - CONNECTIONS_START) / (CONNECTIONS_END - CONNECTIONS_START));
    const visibleSegments = Math.round(connectionProgress * segmentCount);
    geometry.setDrawRange(0, visibleSegments * 2);
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#5ac8fa" transparent opacity={0.5} toneMapped={false} />
    </lineSegments>
  );
}
