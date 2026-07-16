"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { CameraRig } from "./CameraRig";
import { ConnectionTower } from "./ConnectionTower";
import { BusinessNodes } from "./BusinessNodes";
import { ConnectionLines } from "./ConnectionLines";
import { SceneLighting } from "./SceneLighting";

export default function SceneCanvas() {
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true" role="presentation">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1.2, 11] }}
        frameloop={tabVisible ? "always" : "never"}
      >
        <fog attach="fog" args={["#050505", 10, 20]} />
        <SceneLighting />
        <CameraRig />
        <ConnectionTower />
        <BusinessNodes />
        <ConnectionLines />
      </Canvas>
    </div>
  );
}
