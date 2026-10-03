import cubeImage from "@/assets/vertice-cube-static.jpg.asset.json";

// Escena estática: imagen fija del cubo a la izquierda, detrás del título.
export function CubeScrollScene() {
  return (
    <div className="cube-scroll-scene is-ready" aria-hidden="true">
      <img
        className="cube-scroll-poster is-loaded"
        src={cubeImage.url}
        alt=""
        width={1240}
        height={1240}
        decoding="async"
      />
    </div>
  );
}
