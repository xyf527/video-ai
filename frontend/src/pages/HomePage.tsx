import { useEffect, useState } from "react";
import { fetchHealth, type HealthResponse } from "../api/client";


type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export function HomePage() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth({ status: "success", data }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to reach the backend";
        setHealth({ status: "error", message });
      });
  }, []);

  return (
    <main className="page-shell">
      <section className="hero-card" aria-labelledby="page-title">
        <p className="eyebrow">AI Video Knowledge Assistant</p>
        <h1 id="page-title">Video knowledge, grounded in the source.</h1>
        <p className="intro">
          The project bootstrap is ready. Backend connectivity is checked below so the next stages can
          build on a reliable API boundary.
        </p>
        <div className={`health-panel health-${health.status}`} role="status" aria-live="polite">
          {health.status === "loading" && <><span className="status-dot" />Connecting to backend…</>}
          {health.status === "success" && (
            <><span className="status-dot" />Backend connected: {health.data.status}</>
          )}
          {health.status === "error" && (
            <><span className="status-dot" />Backend connection failed: {health.message}</>
          )}
        </div>
      </section>
    </main>
  );
}
