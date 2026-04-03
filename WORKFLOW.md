# Git 工作流和代码规范

## 1. Git 工作流

### 1.1 分支策略

我们使用简化的 Git Flow，适合小团队快速迭代：

```
master (主分支，生产环境)
  ↓
develop (开发分支，测试环境) - 可选
  ↓
feature/* (功能分支)
fix/* (修复分支)
```

**分支说明**：
- `master`：主分支，始终保持可部署状态
- `feature/*`：功能开发分支，从 master 创建
- `fix/*`：Bug修复分支，从 master 创建

### 1.2 分支命名规范

**功能分支**：
```
feature/功能描述
feature/user-authentication
feature/ai-generation-pipeline
feature/layout-template-system
```

**修复分支**：
```
fix/问题描述
fix/login-token-expiration
fix/file-upload-error
```

**其他分支**：
```
refactor/重构描述
docs/文档更新描述
chore/杂项描述
```

### 1.3 工作流程

**开发新功能**：
```bash
# 1. 从 master 创建功能分支
git checkout master
git pull origin master
git checkout -b feature/my-feature

# 2. 开发和提交
git add .
git commit -m "feat: add user authentication"

# 3. 推送到远程
git push origin feature/my-feature

# 4. 在 GitHub 创建 Pull Request
# 5. Code Review 通过后合并到 master
# 6. 删除功能分支
git branch -d feature/my-feature
```

**修复Bug**：
```bash
# 1. 从 master 创建修复分支
git checkout master
git pull origin master
git checkout -b fix/bug-description

# 2. 修复和提交
git add .
git commit -m "fix: resolve login token expiration"

# 3. 推送并创建 PR
git push origin fix/bug-description
```

### 1.4 Pull Request 流程

1. **创建 PR**：
   - 使用 PR 模板填写信息
   - 标题清晰描述改动
   - 关联相关 Issue（如有）

2. **Code Review**：
   - 至少一人 Review（小团队可灵活调整）
   - 解决所有 Review 意见
   - 确保 CI 检查通过

3. **合并**：
   - 使用 "Squash and merge" 保持提交历史清晰
   - 删除已合并的分支

4. **同步**：
   - 合并后及时同步 master 分支
   ```bash
   git checkout master
   git pull origin master
   ```

---

## 2. Commit 规范

### 2.1 Commit Message 格式

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**：
```
feat(auth): add JWT token refresh mechanism

- Implement token refresh endpoint
- Add refresh token to user session
- Update frontend to handle token refresh

Closes #123
```

### 2.2 Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(api): add project delete endpoint |
| `fix` | Bug修复 | fix(ui): resolve button alignment issue |
| `docs` | 文档更新 | docs: update API documentation |
| `style` | 代码格式（不影响功能） | style: format code with prettier |
| `refactor` | 重构（不改变功能） | refactor(db): optimize query performance |
| `test` | 添加测试 | test(auth): add login unit tests |
| `chore` | 构建/工具变动 | chore: update dependencies |
| `perf` | 性能优化 | perf(api): add Redis cache |

### 2.3 Scope 范围

**后端**：
- `api` - API接口
- `auth` - 认证模块
- `db` - 数据库
- `agent` - AI Agent
- `file` - 文件处理

**前端**：
- `ui` - UI组件
- `page` - 页面
- `store` - 状态管理
- `hook` - 自定义Hook
- `style` - 样式

**通用**：
- `config` - 配置
- `deps` - 依赖
- `ci` - CI/CD

### 2.4 Subject 主题

- 使用祈使句，现在时："add" 而不是 "added" 或 "adds"
- 首字母小写
- 结尾不加句号
- 简洁明了，不超过50个字符

### 2.5 Body 正文（可选）

- 详细描述改动的内容和原因
- 可以分多行
- 解释"是什么"和"为什么"，而不是"怎么做"

### 2.6 Footer 页脚（可选）

- 关联 Issue：`Closes #123` 或 `Fixes #456`
- Breaking Changes：`BREAKING CHANGE: API endpoint changed`

---

## 3. 代码规范

### 3.1 Go 后端规范

**命名规范**：
- 包名：小写，单个单词，如 `handlers`、`models`
- 文件名：小写，下划线分隔，如 `user_handler.go`
- 函数名：驼峰命名，导出函数首字母大写
- 变量名：驼峰命名，简短但有意义

**代码风格**：
- 使用 `gofmt` 格式化代码
- 使用 `golint` 检查代码质量
- 导出的函数必须有注释
- 错误处理不能忽略

**示例**：
```go
// GetUserByID retrieves a user by their ID
func GetUserByID(id string) (*models.User, error) {
    var user models.User
    if err := db.First(&user, "id = ?", id).Error; err != nil {
        return nil, err
    }
    return &user, nil
}
```

### 3.2 React 前端规范

**命名规范**：
- 组件文件：PascalCase，如 `UserProfile.tsx`
- 工具文件：camelCase，如 `apiClient.ts`
- 组件名：PascalCase
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE

**代码风格**：
- 使用 TypeScript 严格模式
- 使用函数组件和 Hooks
- Props 必须定义类型
- 使用 ESLint 和 Prettier

**组件结构**：
```typescript
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types
interface UserProfileProps {
  userId: string;
}

// 3. Component
export default function UserProfile({ userId }: UserProfileProps) {
  // 4. Hooks
  const [isEditing, setIsEditing] = useState(false);
  const { data: user } = useQuery(...);

  // 5. Handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 6. Render
  return (
    <div>...</div>
  );
}
```

### 3.3 文件组织

**后端目录结构**：
```
backend-go/
├── cmd/server/          # 入口文件
├── internal/
│   ├── handlers/        # HTTP handlers（按功能分文件）
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
└── data/                # 数据文件
```

**前端目录结构**：
```
frontend-react/
├── src/
│   ├── pages/           # 页面组件
│   ├── components/      # 可复用组件
│   ├── hooks/           # 自定义Hooks
│   ├── store/           # 状态管理
│   ├── lib/             # 工具库
│   └── types/           # TypeScript类型定义
└── public/              # 静态资源
```

---

## 4. Code Review 指南

### 4.1 Review 重点

**功能性**：
- 代码是否实现了预期功能？
- 是否有边界情况未处理？
- 错误处理是否完善？

**代码质量**：
- 代码是否清晰易读？
- 是否遵循项目规范？
- 是否有重复代码？
- 命名是否合理？

**性能和安全**：
- 是否有性能问题？
- 是否有安全漏洞？
- 数据库查询是否优化？

**测试**：
- 是否需要添加测试？
- 现有测试是否通过？

### 4.2 Review 礼仪

**提出意见**：
- 使用建议性语气："建议..." 而不是 "必须..."
- 解释原因："这样做可以提高性能，因为..."
- 提供示例："可以这样改进：..."

**接受意见**：
- 保持开放心态
- 理解意见背后的原因
- 不确定时主动讨论

**常用标记**：
- `nit:` - 小问题，可改可不改
- `question:` - 疑问，需要解释
- `suggestion:` - 建议改进
- `blocking:` - 必须修改才能合并

---

## 5. 常见场景

### 5.1 同步远程更新

```bash
# 更新本地 master
git checkout master
git pull origin master

# 将 master 合并到功能分支
git checkout feature/my-feature
git merge master

# 或使用 rebase（保持提交历史线性）
git rebase master
```

### 5.2 修改最后一次提交

```bash
# 修改提交信息
git commit --amend -m "new message"

# 添加遗漏的文件
git add forgotten-file.go
git commit --amend --no-edit
```

### 5.3 撤销更改

```bash
# 撤销工作区的修改
git checkout -- file.go

# 撤销暂存区的修改
git reset HEAD file.go

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1
```

### 5.4 解决冲突

```bash
# 1. 拉取最新代码时发现冲突
git pull origin master

# 2. 手动解决冲突文件
# 编辑文件，删除冲突标记 <<<<<<<, =======, >>>>>>>

# 3. 标记为已解决
git add conflicted-file.go

# 4. 完成合并
git commit -m "merge: resolve conflicts with master"
```

---

## 6. 工具配置

### 6.1 Git 配置

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认编辑器
git config --global core.editor "vim"

# 设置默认分支名
git config --global init.defaultBranch master

# 启用颜色输出
git config --global color.ui auto
```

### 6.2 .gitignore

项目已包含 `.gitignore` 文件，涵盖：
- Go 编译产物
- Node.js 依赖
- IDE 配置文件
- 环境变量文件
- 数据库文件
- 日志文件

### 6.3 EditorConfig

建议添加 `.editorconfig` 统一编辑器配置：
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{go}]
indent_style = tab
indent_size = 4

[*.{ts,tsx,js,jsx,json}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## 7. 快速参考

### 7.1 常用命令

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline --graph

# 查看分支
git branch -a

# 切换分支
git checkout branch-name

# 创建并切换分支
git checkout -b new-branch

# 删除本地分支
git branch -d branch-name

# 删除远程分支
git push origin --delete branch-name

# 暂存当前更改
git stash

# 恢复暂存的更改
git stash pop
```

### 7.2 Commit Message 模板

```
feat(scope): add new feature

- Implement feature A
- Update related components
- Add unit tests

Closes #123
```

```
fix(scope): resolve bug description

- Identify root cause
- Apply fix
- Add regression test

Fixes #456
```

---

**文档版本**：v1.0
**最后更新**：2026-04-04
**维护者**：DeckGenie Team
