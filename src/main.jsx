import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import FabricProtocolArchitecture from "./FabricProtocolArchitecture";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FabricProtocolArchitecture />
  </StrictMode>,
);
