// src/main.js
import "./styles.css";
import "./stars.css";
import { initGame3x3 } from "./Game3x3.js";

window.addEventListener("DOMContentLoaded", () => {
  let root = document.getElementById("root");
  if (!root) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  }

  root.style.minHeight = "100vh";
  root.style.width = "100%";
  root.style.position = "relative";
  root.style.overflow = "hidden";

  initGame3x3(root);
});
