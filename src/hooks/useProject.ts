import { useState, useRef, useCallback } from "react";
import type { Project } from "../store/types";
import { initialProject } from "../store/defaults";
export function useProject() {
  const [project, setProject] = useState<Project>(initialProject);
  const ref = useRef(project);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const [, tick] = useState(0);
  const last = useRef({ key: "", time: 0 });
  const update = useCallback(
    (change: Partial<Project> | ((p: Project) => Project), key = "") => {
      const now = Date.now();
      if (!key || last.current.key !== key || now - last.current.time > 700) {
        past.current.push(ref.current);
        if (past.current.length > 100) past.current.shift();
      }
      last.current = { key, time: now };
      future.current = [];
      ref.current =
        typeof change === "function"
          ? change(ref.current)
          : { ...ref.current, ...change };
      setProject(ref.current);
    },
    [],
  );
  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    future.current.push(ref.current);
    ref.current = p;
    setProject(p);
    last.current.key = "";
    tick((x) => x + 1);
  }, []);
  const redo = useCallback(() => {
    const p = future.current.pop();
    if (!p) return;
    past.current.push(ref.current);
    ref.current = p;
    setProject(p);
    last.current.key = "";
    tick((x) => x + 1);
  }, []);
  return {
    project,
    update,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
