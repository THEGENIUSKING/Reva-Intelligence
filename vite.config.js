import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/pptxgenjs/")) return "vendor-powerpoint";
          if (id.includes("/html2canvas/")) return "vendor-html2canvas";
          if (id.includes("/jspdf/")) return "vendor-pdf";
          if (id.includes("/docx/")) return "vendor-word";
          if (id.includes("/mammoth/") || id.includes("/fflate/")) return "vendor-document";
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
