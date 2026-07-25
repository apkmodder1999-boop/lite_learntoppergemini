// Best-effort deterrent against casual inspection. Not a security boundary.
export function installDebugBlockers() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __debugBlockersInstalled?: boolean }).__debugBlockersInstalled)
    return;
  (window as unknown as { __debugBlockersInstalled?: boolean }).__debugBlockersInstalled = true;

  window.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    const key = e.key?.toLowerCase();
    // F12
    if (e.key === "F12") {
      e.preventDefault();
      return;
    }
    // Ctrl/Cmd + Shift + I/J/C  (devtools/console/inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) {
      e.preventDefault();
      return;
    }
    // Ctrl/Cmd + U (view source)
    if ((e.ctrlKey || e.metaKey) && key === "u") {
      e.preventDefault();
      return;
    }
    // Ctrl/Cmd + S (save page)
    if ((e.ctrlKey || e.metaKey) && key === "s") {
      e.preventDefault();
      return;
    }
  });
}
