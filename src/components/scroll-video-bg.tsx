import { useEffect, useRef, useState } from "react";

const VIDEO = "/media/vertice-fondo-scroll.mp4";
const POSTER = "/media/vertice-fondo-poster.jpg";

export function ScrollVideoBackground() {
  const ref = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 759px)");
    const update = () => setUseVideo(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!useVideo || failed) return;
    const video = ref.current;
    if (!video) return;
    let target = 0;
    let current = 0;
    let raf = 0;
    const computeTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      target = p * (video.duration || 0);
    };
    const tick = () => {
      if (video.duration) {
        current += (target - current) * 0.12;
        if (Math.abs(video.currentTime - current) >= 0.02) {
          try { video.currentTime = current; } catch { /* ignore */ }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", computeTarget, { passive: true });
    window.addEventListener("resize", computeTarget, { passive: true });
    video.addEventListener("loadedmetadata", computeTarget);
    computeTarget();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", computeTarget);
      window.removeEventListener("resize", computeTarget);
      video.removeEventListener("loadedmetadata", computeTarget);
    };
  }, [useVideo, failed]);

  return (
    <div className="pub-bg" aria-hidden="true">
      {useVideo && !failed ? (
        <video ref={ref} className="pub-bg-media" src={VIDEO} poster={POSTER} muted playsInline preload="auto" aria-hidden="true" onError={() => setFailed(true)} />
      ) : (
        <img className="pub-bg-media" src={POSTER} alt="" />
      )}
      <div className="pub-bg-veil" />
    </div>
  );
}
