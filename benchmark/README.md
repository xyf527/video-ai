# Benchmark Directory Convention

所有阶段材料按“类别 → Phase → 固定文件名”组织，禁止继续把阶段号拼进同一目录下的大量文件名。

```text
benchmark/
├── tasks/
│   └── phase-XX/
│       └── task.md
├── prompts/
│   └── phase-XX/
│       └── common.md
├── reports/
│   └── phase-XX/
│       ├── codex.md
│       ├── claude.md
│       └── comparison.md
├── tests/
│   └── hidden/
│       └── phase-XX/
├── judge/
│   └── phase-XX/
├── results/
│   └── final-comparison.md
└── archive/
    └── phase-XX/
```

规则：

- `task.md` 是该阶段唯一公共开发任务。
- `common.md` 是发送给两个候选的完全相同提示词。
- `reports/phase-XX/` 只存放该阶段验收结果。
- Hidden Tests 与 Judge 工具也必须按 Phase 分目录；没有内容时不创建空目录。
- 被替代但需要保留的草稿移入 `archive/phase-XX/`。
- 每次发布任务前，主控必须将 `task.md` 实际同步到两个候选 Worktree，并校验 SHA-256 一致。
- 候选收到的提示词必须包含任务文件的绝对路径、统一相对路径和预期 SHA-256。
- macOS 必须使用 `shasum -a 256 <file>`，Linux 可使用 `sha256sum <file>`；禁止用裸 `shasum` 生成或核验 SHA-256。
- 发布记录必须同时写明算法、校验命令和 64 位摘要。算法或摘要写错属于主控分发事故，不计候选失败、重试或人工干预。
