import { createRoot } from "react-dom/client";
import { Popup } from "./Popup";
import "../styles.css";

const el = document.getElementById("root");
if (el) createRoot(el).render(<Popup />);
