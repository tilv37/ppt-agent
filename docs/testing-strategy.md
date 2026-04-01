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

### 1.3 测试原则

- **快速反馈**：单元测试总运行时间 < 30 秒
- **Mock 外部依赖**：LLM API、Unsplash API、文件系统操作均使用 Mock
- **覆盖率目标**：核心逻辑模块 > 80%，工具函数 > 90%
- **测试与代码同目录**：`__tests__/` 子目录或 `.test.ts` 后缀

---

## 2. 项目配置

### 2.1 Jest 配置

```typescript
// jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/lib/**/*.test.ts",
    "<rootDir>/app/api/**/*.test.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "lib/**/*.ts",
    "app/api/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

export default createJestConfig(config);
```

### 2.2 前端组件测试配置

```typescript
// jest.config.client.ts
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/components/**/*.test.tsx",
    "<rootDir>/hooks/**/*.test.ts",
    "<rootDir>/store/**/*.test.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
```

### 2.3 package.json scripts

```json
{
  "scripts": {
    "test": "jest --config jest.config.ts",
    "test:client": "jest --config jest.config.client.ts",
    "test:all": "npm run test && npm run test:client",
    "test:watch": "jest --config jest.config.ts --watch",
    "test:coverage": "jest --config jest.config.ts --coverage"
  }
}
```

---

## 3. 测试分类与范围

### 3.1 Agent 逻辑测试

每个 Agent 的测试重点：**输出解析 + Schema 校验 + 异常处理**。

```
lib/agents/__tests__/
  content-extraction.test.ts
  outline-planner.test.ts
  content-writer.test.ts
  layout-selector.test.ts
  visual-decision.test.ts
  graphic-generator.test.ts
  image-search.test.ts
  quality-review.test.ts
  chat-intent.test.ts
```

**测试示例 — OutlinePlannerAgent**：

```typescript
import { validateAgentOutput } from "@/lib/agents/validator";
import outlineSchema from "@/lib/agents/schemas/outline-planner.schema.json";

describe("OutlinePlannerAgent", () => {
  describe("output validation", () => {
    it("should accept valid outline output", () => {
      const validOutput = {
        agent: "OutlinePlannerAgent",
        status: "success",
        result: {
          title: "Q1 工作汇报",
          totalSlides: 8,
          slides: [
            {
              index: 0,
              title: "封面",
              templateCategory: "cover",
              keyPoints: ["Q1 工作汇报"],
              suggestedVisual: "none",
              visualBrief: "",
              estimatedWordCount: 30,
            },
          ],
          structureNotes: "Standard business report structure",
        },
        reasoning: "Created 8-slide outline",
      };

      expect(() => validateAgentOutput(validOutput, outlineSchema)).not.toThrow();
    });

    it("should reject output with invalid templateCategory", () => {
      const invalidOutput = {
        agent: "OutlinePlannerAgent",
        status: "success",
        result: {
          title: "Test",
          totalSlides: 1,
          slides: [
            {
              index: 0,
              title: "Test",
              templateCategory: "invalid_type",
              keyPoints: [],
              suggestedVisual: "none",
              visualBrief: "",
              estimatedWordCount: 30,
            },
          ],
          structureNotes: "",
        },
        reasoning: "",
      };

      expect(() => validateAgentOutput(invalidOutput, outlineSchema)).toThrow();
    });

    it("should reject output with too many key points per slide", () => {
      const output = createOutputWithKeyPoints(6); // > 5 上限
      expect(() => validateAgentOutput(output, outlineSchema)).toThrow();
    });
  });

  describe("revision request", () => {
    it("should parse needs_revision status correctly", () => {
      const revisionOutput = {
        agent: "OutlinePlannerAgent",
        status: "needs_revision",
        result: null,
        reasoning: "Slide count mismatch",
        revisionRequest: {
          targetAgent: "ContentWriterAgent",
          slideIndex: 2,
          instruction: "Reduce content",
        },
      };

      expect(revisionOutput.status).toBe("needs_revision");
      expect(revisionOutput.revisionRequest).toBeDefined();
    });
  });
});
```

### 3.2 工具函数测试

```
lib/utils/__tests__/
  svg-sanitizer.test.ts
  url-validator.test.ts
  pdf-cleaner.test.ts
  text-utils.test.ts
  file-validator.test.ts
  retry.test.ts
```

**测试示例 — SVG Sanitizer**：

```typescript
import { sanitizeSvg } from "@/lib/utils/svg-sanitizer";

describe("sanitizeSvg", () => {
  it("should remove script tags", () => {
    const input = '<svg><script>alert("xss")</script><rect/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain("<script>");
  });

  it("should remove on* event attributes", () => {
    const input = '<svg><rect onclick="alert(1)" onload="hack()"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onload");
  });

  it("should preserve valid SVG elements", () => {
    const input = '<svg><rect x="0" y="0" width="100" height="100" fill="red"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).toContain("<rect");
    expect(result).toContain('fill="red"');
  });

  it("should reject SVG exceeding size limit", () => {
    const input = "<svg>" + "x".repeat(600 * 1024) + "</svg>";
    expect(() => sanitizeSvg(input)).toThrow(/size limit/);
  });
});
```

**测试示例 — URL Validator (SSRF)**：

```typescript
import { validateUrl } from "@/lib/utils/url-validator";

describe("validateUrl", () => {
  it("should allow valid HTTPS URLs", () => {
    expect(() => validateUrl("https://example.com/page")).not.toThrow();
  });

  it("should reject localhost", () => {
    expect(() => validateUrl("http://localhost:3000")).toThrow();
    expect(() => validateUrl("http://127.0.0.1")).toThrow();
  });

  it("should reject internal IP ranges", () => {
    expect(() => validateUrl("http://10.0.0.1")).toThrow();
    expect(() => validateUrl("http://192.168.1.1")).toThrow();
    expect(() => validateUrl("http://172.16.0.1")).toThrow();
  });

  it("should reject non-HTTP protocols", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow();
    expect(() => validateUrl("file:///etc/passwd")).toThrow();
  });
});
```

**测试示例 — Retry 逻辑**：

```typescript
import { withRetry } from "@/lib/utils/retry";

describe("withRetry", () => {
  it("should succeed on first attempt if no error", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after max retries", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it("should not retry non-retryable errors", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("401 Unauthorized"));
    await expect(
      withRetry(fn, { maxRetries: 3, baseDelay: 10, isRetryable: (e) => !e.message.includes("401") })
    ).rejects.toThrow("401");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

### 3.3 Schema 校验测试

集中测试所有 Agent 的 JSON Schema 有效性：

```typescript
import Ajv from "ajv";
import * as schemas from "@/lib/agents/schemas";

describe("Agent JSON Schemas", () => {
  const ajv = new Ajv();

  Object.entries(schemas).forEach(([name, schema]) => {
    it(`${name} should be a valid JSON Schema`, () => {
      const validate = ajv.compile(schema);
      expect(validate).toBeDefined();
    });
  });
});
```

### 3.4 API Handler 测试

测试路由 handler 的输入校验和业务逻辑（Mock 数据库层）：

```typescript
import { POST } from "@/app/api/v1/auth/login/route";
import { prismaMock } from "@/lib/__mocks__/prisma";

describe("POST /api/v1/auth/login", () => {
  it("should return 400 if username is missing", async () => {
    const req = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "12345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 401 if user not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "nobody", password: "12345678" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
```

### 3.5 前端组件测试

针对关键交互组件编写测试：

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { SlidePanel } from "@/components/SlidePanel";

describe("SlidePanel", () => {
  it("should render slide thumbnails", () => {
    const slides = [
      { id: "1", title: "封面", thumbnailUrl: "/thumb/1.png" },
      { id: "2", title: "目录", thumbnailUrl: "/thumb/2.png" },
    ];

    render(<SlidePanel slides={slides} selectedIndex={0} onSelect={jest.fn()} />);

    expect(screen.getByText("封面")).toBeInTheDocument();
    expect(screen.getByText("目录")).toBeInTheDocument();
  });

  it("should call onSelect when clicking a slide", () => {
    const onSelect = jest.fn();
    const slides = [{ id: "1", title: "封面", thumbnailUrl: "/thumb/1.png" }];

    render(<SlidePanel slides={slides} selectedIndex={-1} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("封面"));

    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
```

---

## 4. Mock 策略

### 4.1 LLM Mock

所有 Agent 测试中 Mock LLM 调用，使用预录制的响应：

```typescript
// lib/agents/__mocks__/llm.ts
export const mockLLMCall = jest.fn();

// 预录制响应文件
// lib/agents/__mocks__/responses/outline-planner-success.json
// lib/agents/__mocks__/responses/outline-planner-invalid-json.json
```

### 4.2 数据库 Mock

使用 jest-mock-extended Mock Prisma Client：

```typescript
// lib/__mocks__/prisma.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: prismaMock,
}));
```

### 4.3 外部 API Mock

```typescript
// Mock Unsplash
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
```

---

## 5. 测试文件结构

```
lib/
  agents/
    __tests__/
      content-extraction.test.ts
      outline-planner.test.ts
      content-writer.test.ts
      layout-selector.test.ts
      visual-decision.test.ts
      graphic-generator.test.ts
      image-search.test.ts
      quality-review.test.ts
      chat-intent.test.ts
      validator.test.ts
    __mocks__/
      llm.ts
      responses/
        *.json
  utils/
    __tests__/
      svg-sanitizer.test.ts
      url-validator.test.ts
      pdf-cleaner.test.ts
      text-utils.test.ts
      file-validator.test.ts
      retry.test.ts
  __mocks__/
    prisma.ts

app/
  api/v1/
    auth/__tests__/
      login.test.ts
      register.test.ts
    projects/__tests__/
      projects.test.ts

components/
  __tests__/
    SlidePanel.test.tsx
    ChatPanel.test.tsx
    SvgPreview.test.tsx

store/
  __tests__/
    presentation-store.test.ts
```

---

## 6. CI 集成

在部署前运行测试：

```yaml
# 可在 docker-compose 中添加测试服务，或在构建阶段运行
# Dockerfile 构建阶段添加：
RUN npm run test -- --ci --passWithNoTests
```

本地开发常用命令：

```bash
# 运行所有测试
npm run test:all

# 监听模式开发
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行单个测试文件
npx jest lib/utils/__tests__/svg-sanitizer.test.ts
```
