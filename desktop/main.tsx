import { createRoot } from "react-dom/client";

import { BrechaApp } from "../src/components/brecha-app";
import "../src/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el contenedor principal");

createRoot(root).render(
  <BrechaApp />,
);
