import { useEffect, useRef } from "react";

import cubePoster from "@/assets/vertice-cube-poster.jpg.asset.json";
import cubeVideoMp4 from "@/assets/vertice-cube-scroll.mp4.asset.json";
import cubeVideoWebm from "@/assets/vertice-cube-scroll.webm.asset.json";

export function CubeScrollScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(max-width: 760px)");
    if (reduceMotion.matches || smallScreen.matches) return;

    let targetTime = 0;
    let displayedTime = 0;
    let animating = false;

    const animate = () => {
      frameRef.current = undefined;
      const video = videoRef.current;
      if (!video) return;

      const diff = targetTime - displayedTime;
      if (Math.abs(diff) > 0.005) {
        displayedTime += diff * 0.12;
        video.currentTime = displayedTime;
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        displayedTime = targetTime;
        video.currentTime = targetTime;
        animating = false;
      }
    };

    const startAnimation = () => {
      if (animating) return;
      animating = true;
      if (frameRef.current === undefined) frameRef.current = window.requestAnimationFrame(animate);
    };

    const syncVideoToScroll = () => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
      targetTime = progress * Math.max(video.duration - 0.04, 0);
      video.classList.toggle("is-visible", progress > 0.002);
      posterRef.current?.classList.toggle("is-hidden", progress > 0.002);
      startAnimation();
    };

    const requestSync = () => {
      window.requestAnimationFrame(syncVideoToScroll);
    };

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    requestSync();

    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      if (frameRef.current !== undefined) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="cube-scroll-scene" aria-hidden="true">
      <img
        ref={posterRef}
        className="cube-scroll-poster"
        src={cubePoster.url}
        alt=""
      />
      <video
        ref={videoRef}
        className="cube-scroll-video"
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        onLoadedMetadata={(event) => {
          event.currentTarget.pause();
          event.currentTarget.currentTime = 0;
          window.dispatchEvent(new Event("scroll"));
        }}
      >
        <source src={cubeVideoWebm.url} type="video/webm" />
        <source src={cubeVideoMp4.url} type="video/mp4" />
      </video>
    </div>
  );
}