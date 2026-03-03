import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("jarvisDesktop", {
  app: {
    name: "Jarvis UI",
    phase: "Phase-1 Day-15"
  }
});
