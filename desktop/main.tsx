import { createRoot } from "react-dom/client";

import { VectorApp } from "../src/components/vector-app";
import { BRAND } from "../src/brand";
import "../src/styles.css";

document.title = `${BRAND.name} — ${BRAND.tagline}`;
const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el contenedor principal");

createRoot(root).render(<VectorApp />);
