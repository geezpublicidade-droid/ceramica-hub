import * as THREE from "three";

export const FLOOR_COUNT = 9;
export const FLOOR_HEIGHT = 1.15;
export const NODES_PER_FLOOR = 6;
export const NODE_COUNT = FLOOR_COUNT * NODES_PER_FLOOR;
export const TOWER_RADIUS = 2.3;

/** PRNG determinístico — evita variação entre montagens da cena */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type NodePosition = {
  position: THREE.Vector3;
  floor: number;
  /** 0→1, ordem em que o nó acende ao longo do scroll */
  activationOrder: number;
};

export function buildNodePositions(): NodePosition[] {
  const random = mulberry32(42);
  const nodes: NodePosition[] = [];

  for (let floor = 0; floor < FLOOR_COUNT; floor++) {
    const y = floor * FLOOR_HEIGHT - (FLOOR_COUNT * FLOOR_HEIGHT) / 2;
    const angleOffset = random() * Math.PI * 2;

    for (let i = 0; i < NODES_PER_FLOOR; i++) {
      const angle = angleOffset + (i / NODES_PER_FLOOR) * Math.PI * 2;
      const radius = TOWER_RADIUS + (random() - 0.5) * 0.3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      nodes.push({
        position: new THREE.Vector3(x, y, z),
        floor,
        activationOrder: nodes.length / (FLOOR_COUNT * NODES_PER_FLOOR - 1),
      });
    }
  }

  return nodes;
}

export type Connection = {
  from: number;
  to: number;
  /** 0→1, ordem em que a conexão se desenha ao longo do scroll */
  order: number;
};

/** Conexões curadas entre nós de andares iguais ou adjacentes — evita "aranha" visual */
export function buildConnections(nodes: NodePosition[]): Connection[] {
  const random = mulberry32(7);
  const connections: Connection[] = [];

  for (let floor = 0; floor < FLOOR_COUNT; floor++) {
    const floorIndices = nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => node.floor === floor)
      .map(({ index }) => index);

    for (let i = 0; i < floorIndices.length; i++) {
      const next = floorIndices[(i + 1) % floorIndices.length];
      if (random() > 0.35) {
        connections.push({ from: floorIndices[i], to: next, order: 0 });
      }
    }

    if (floor < FLOOR_COUNT - 1) {
      const currentFloor = floorIndices;
      const nextFloor = nodes
        .map((node, index) => ({ node, index }))
        .filter(({ node }) => node.floor === floor + 1)
        .map(({ index }) => index);

      const bridges = 2;
      for (let b = 0; b < bridges; b++) {
        const from = currentFloor[Math.floor(random() * currentFloor.length)];
        const to = nextFloor[Math.floor(random() * nextFloor.length)];
        connections.push({ from, to, order: 0 });
      }
    }
  }

  return connections.map((connection, index) => ({
    ...connection,
    order: index / Math.max(connections.length - 1, 1),
  }));
}
