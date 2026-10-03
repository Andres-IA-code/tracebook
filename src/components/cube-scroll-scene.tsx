import { useEffect, useRef, useState } from "react";
import cubeVideoMp4 from "@/assets/vertice-cube-scene.mp4.asset.json";
import cubeVideoWebm from "@/assets/vertice-cube-scene.webm.asset.json";
import cubePoster from "@/assets/vertice-cube-poster.jpg.asset.json";

// Escena del cubo: video cuya línea de tiempo sigue el scroll de la página,
// centrado detrás del título principal de la portada.
export function CubeScrollScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let target = 0;
    let current = 0;
    let duration = 0;

    const measure = () => {
      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      target = Math.min(1, Math.max(0, window.scrollY / scrollable));
    };

    const tick = () => {
      // Interpolación gradual para suavizar el movimiento en ambas direcciones.
      current += (target - current) * 0.08;
      if (duration > 0 && Math.abs(video.currentTime - current * duration) > 0.03) {
        video.currentTime = current * duration;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMeta = () => {
      duration = video.duration || 0;
      video.pause();
    };

    video.addEventListener("loadedmetadata", onMeta);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [videoOk]);

  return (
    <div className={`cube-scroll-scene${ready ? " is-ready" : ""}`} aria-hidden="true">
      <img
        className="cube-scroll-poster"
        src={cubePoster.url}
        alt=""
        width={640}
        height={360}
        decoding="async"
        onLoad={() => setReady(true)}
        ref={(el) => {
          if (el?.complete) setReady(true);
        }}
      />
      {videoOk && (
        <video
          ref={videoRef}
          className="cube-scroll-video"
          muted
          playsInline
          preload="auto"
          width={640}
          height={360}
          onCanPlay={() => setReady(true)}
          onError={() => setVideoOk(false)}
        >
          <source src={cubeVideoWebm.url} type="video/webm" />
          <source src={cubeVideoMp4.url} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
