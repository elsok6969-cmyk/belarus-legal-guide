import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const srcPath = path.resolve(__dirname, "./src");
const reactPath = path.resolve(__dirname, "./node_modules/react/index.js");
const reactJsxRuntimePath = path.resolve(__dirname, "./node_modules/react/jsx-runtime.js");
const reactJsxDevRuntimePath = path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime.js");
const reactDomPath = path.resolve(__dirname, "./node_modules/react-dom/index.js");
const reactDomClientPath = path.resolve(__dirname, "./node_modules/react-dom/client.js");

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: srcPath },
      { find: /^react$/, replacement: reactPath },
      { find: /^react\/jsx-runtime$/, replacement: reactJsxRuntimePath },
      { find: /^react\/jsx-dev-runtime$/, replacement: reactJsxDevRuntimePath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react-dom\/client$/, replacement: reactDomClientPath },
    ],
    dedupe: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query"],
  },
}));
