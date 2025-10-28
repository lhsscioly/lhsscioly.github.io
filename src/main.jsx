import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HashRouter as Router } from "react-router-dom";
import "./index.css";

// Creates the website root with hash-routing
createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>,
);
