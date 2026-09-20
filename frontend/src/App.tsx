import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { fetchHealth, type HealthResponse } from "./api/client";
import "./styles.css";

function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then(setHealth)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "无法连接后端服务",
        );
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="shell">
      <p className="eyebrow">AI VIDEO KNOWLEDGE ASSISTANT</p>
      <h1>把视频变成可以追溯的知识。</h1>
      <p className="intro">
        Phase 01 已建立最小前后端骨架。后续阶段将在这里逐步接入视频理解能力。
      </p>

      <section className="status-card" aria-live="polite">
        <span className="status-label">后端连接状态</span>
        {health && <p className="status success">● 已连接 · {health.service}</p>}
        {error && <p className="status failure">● 连接失败 · {error}</p>}
        {!health && !error && <p className="status loading">● 正在连接后端…</p>}
      </section>

      <Link className="text-link" to="/about">查看项目说明 →</Link>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="shell">
      <p className="eyebrow">PROJECT BOOTSTRAP</p>
      <h1>AI Video Knowledge Assistant</h1>
      <p className="intro">一个面向私人视频内容的知识理解与问答系统。</p>
      <Link className="text-link" to="/">← 返回首页</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
