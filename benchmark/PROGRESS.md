# Benchmark Progress

> 本文件由项目总控维护。状态必须根据 Git 和实际验证更新，不能只复制候选 Agent 的自报结果。

## 当前总览

- Current Phase: Phase 02 — Persistence Foundation（PREPARED / NOT DISTRIBUTED）
- Controller Harness: ChatGPT Work（Codex desktop task）
- Controller Model: `gpt-5.6-sol`
- Controller Reasoning Effort: `medium`
- Candidate Router: CC Switch
- Candidate Model: Codex 与 Claude 均为 `gpt-5.6-luna`
- Candidate Reasoning Effort: Codex 与 Claude 均为 `medium`
- Usage / Cost: CC Switch 数据仅供参考，不作为官方账单或评分依据
- Next Gate: 用户体验两个实现并确认是否分发 Phase 02
- Last Verified At: 2026-09-20 (Asia/Shanghai)

## Phase 01

### Codex

- Status: PASSED
- Worktree: `/Users/xyf/PycharmProjects/video-ai-codex`
- Branch: `agent/codex`
- Phase Start Commit: `38b02bc`
- Candidate HEAD: `79bdcac`
- Working Tree: DIRTY（仅未跟踪的本地生成物，不进入候选提交）
- Self Test: REPORTED COMPLETED / 精确运行时长不可用
- Judge Result: PASSED（94/100，DX 为待用户体验的暂定分）
- Fix Round: 0/3
- Human Intervention: Level 0
- Report: `benchmark/reports/phase-01-codex.md`

### Claude

- Status: PASSED
- Worktree: `/Users/xyf/PycharmProjects/video-ai-claude`
- Branch: `agent/claude`
- Phase Start Commit: `38b02bc`
- Candidate HEAD: `530e86f`
- Working Tree: DIRTY（仅未跟踪的本地生成物，不进入候选提交）
- Self Test: REPORTED COMPLETED / 精确运行时长不可用
- Judge Result: PASSED（94/100，DX 为待用户体验的暂定分）
- Fix Round: 0/3
- Human Intervention: Level 0
- Report: `benchmark/reports/phase-01-claude.md`

## Phase 01 Exit Gate

- [x] Codex 已提交 Phase 01 实现
- [x] Claude 已提交 Phase 01 实现
- [x] Codex 工作区与提交范围已核验
- [x] Claude 工作区与提交范围已核验
- [x] Codex 后端测试和编译检查已由 Judge 复现
- [x] Claude 后端测试和编译检查已由 Judge 复现
- [x] Codex 前端生产构建已由 Judge 复现
- [x] Claude 前端生产构建已由 Judge 复现
- [x] 两边 HTTP/API/UI 联通均已人工验证
- [x] Judge / Hidden Tests 已完成
- [x] 两份候选验收报告已生成
- [x] Phase 01 对比报告已生成
- [x] 两个候选均有最终状态
- [x] 用户已确认可以起草 Phase 02

## 下一步

由用户分别体验 `http://127.0.0.1:5173/`（Codex）和 `http://127.0.0.1:5174/`（Claude），补充 Developer Experience 观察；随后将完全相同的 `benchmark/tasks/phase-02.md` 与 `benchmark/prompts/phase-02-common.md` 分发给两个候选。

## 阶段历史

| Phase | Codex | Claude | Comparison | Finalized At |
|---|---|---|---|---|
| Phase 00 | PASSED | PASSED | Baseline established | 2026-08-30 |
| Phase 01 | PASSED | PASSED | Technical tie (94/100 each, provisional DX) | 2026-09-20 |
