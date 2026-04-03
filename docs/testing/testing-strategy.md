# PPT 自动生成 Web 系统 - 测试策略

## 1. 概述

### 1.1 测试目标

以**单元测试**为核心，确保各模块的核心逻辑正确性。重点覆盖：
- Agent 输出解析与 Schema 校验
- 工具函数（SVG 处理、文本清洗、SSRF 防护等）
- API 路由 handler 逻辑
- 状态管理与数据转换

### 1.2 技术栈

| 工具 | 用途 |
|------|------|
| Jest | 测试运行器 + 断言库 |
| React Testing Library | React 组件测试 |
| ts-jest | TypeScript 支持 |
| jest-mock-extended | Mock 工具 |

（文档继续，已移入此文件）