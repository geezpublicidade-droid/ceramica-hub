"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { CubemapAdapter } from "@photo-sphere-viewer/cubemap-adapter";
import "@photo-sphere-viewer/core/index.css";
import type { VirtualTourScene } from "@/lib/services/platform";

function panoramaFor(scene: VirtualTourScene) {
  return scene.kind === "cubemap" ? scene.cubemapUrls : scene.imageUrl;
}

export function VirtualTourViewer({ scenes }: { scenes: VirtualTourScene[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [activeId, setActiveId] = useState(scenes[0]?.id);

  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;
    const hasCubemap = scenes.some((s) => s.kind === "cubemap");
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: panoramaFor(scenes[0]),
      adapter: hasCubemap ? CubemapAdapter : undefined,
      navbar: ["zoom", "fullscreen"],
      loadingTxt: "Carregando...",
    });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToScene(scene: VirtualTourScene) {
    setActiveId(scene.id);
    viewerRef.current?.setPanorama(panoramaFor(scene));
  }

  if (scenes.length === 0) return null;

  return (
    <div>
      <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-3xl sm:h-[520px]" />
      {scenes.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => goToScene(scene)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                activeId === scene.id
                  ? "neu-primary text-white"
                  : "neu text-foreground"
              }`}
            >
              {scene.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
