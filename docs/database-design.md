# PPT 自动生成 Web 系统 - 数据库详细设计

## 1. 概述

### 1.1 技术选型

- **ORM**: Prisma
- **数据库引擎**: SQLite（第一阶段），架构设计预留 PostgreSQL 迁移能力
- **文件存储**: 本地磁盘（`/uploads` 目录）

### 1.2 设计原则

- 单设备单用户：用户注册后通过设备指纹绑定，跨设备登录同一账号
- 不保留历史版本快照，只保留最新状态
- 所有表需包含 `createdAt` / `updatedAt` 审计字段

---

## 2. 数据模型

### 2.1 ER 关系图

```
User (1) ─────< Session (n)
  │
  └────────────< Project (n)
                  │
                  └──────< Presentation (1)
                              │
                              └──────< Slide (n)
                                          │
                                          └──────< ChatMessage (n)

Template (独立表，无外键关联)
AgentTrace (独立表，按 ProjectId 索引)
```

---

## 3. 表结构详解

### 3.1 User（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 用户唯一标识 |
| username | String | Unique, Not Null | 登录用户名 |
| nickname | String | Not Null | 显示昵称 |
| passwordHash | String | Not Null | bcrypt 密码哈希 |
| createdAt | DateTime | Not Null | 注册时间 |
| lastLoginAt | DateTime | Nullable | 最后登录时间 |

**索引**:
- `idx_user_username` ON (`username`)

---

### 3.2 Session（会话表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 会话 ID |
| userId | String | FK -> User.id, Not Null | 所属用户 |
| deviceFingerprint | String | Not Null | 设备指纹 |
| expiresAt | DateTime | Not Null | 过期时间 |
| createdAt | DateTime | Not Null | 创建时间 |

**索引**:
- `idx_session_userId` ON (`userId`)
- `idx_session_deviceFingerprint` ON (`deviceFingerprint`)

**业务规则**:
- Session 有效期 30 天
- 同一设备自动续期

---

### 3.3 Project（项目表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 项目唯一标识 |
| userId | String | FK -> User.id, Not Null | 所属用户 |
| name | String | Not Null | 项目名称 |
| status | String | Not Null | 状态：draft/generating/waiting_outline_confirm/ready/exporting/error |
| coverSlideId | String | Nullable | 封面页 ID（冗余字段） |
| createdAt | DateTime | Not Null | 创建时间 |
| updatedAt | DateTime | Not Null | 更新时间 |

**索引**:
- `idx_project_userId` ON (`userId`)
- `idx_project_status` ON (`status`)

---

### 3.4 Presentation（演示文稿表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 演示文稿 ID |
| projectId | String | FK -> Project.id, Unique, Not Null | 所属项目（一项目一演示） |
| title | String | Not Null | 标题 |
| theme | String | Not Null, Default='default' | 主题名称 |
| aspectRatio | String | Not Null, Default='16:9' | 宽高比 |
| targetSlideCount | Int | Nullable | 目标页数 |
| actualSlideCount | Int | Not Null, Default=0 | 实际页数 |
| createdAt | DateTime | Not Null | 创建时间 |
| updatedAt | DateTime | Not Null | 更新时间 |

**索引**:
- `idx_presentation_projectId` ON (`projectId`)

---

### 3.5 Slide（幻灯片表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 幻灯片 ID |
| presentationId | String | FK -> Presentation.id, Not Null | 所属演示 |
| index | Int | Not Null | 页码（从 0 开始） |
| templateId | String | Nullable | 使用的模板 ID |
| title | String | Nullable | 页面标题 |
| subtitle | String | Nullable | 副标题 |
| contentJson | String | Nullable | 页面内容（JSON 字符串） |
| visualType | String | Nullable | 视觉类型：none/chart/diagram/image |
| generatedSvg | String | Nullable | 生成的 SVG 内容 |
| previewImage | String | Nullable | 预览图路径（/uploads/slides/xxx.png） |
| status | String | Not Null, Default='pending' | 状态：pending/writing/visual_processing/rendered/revising/failed |
| createdAt | DateTime | Not Null | 创建时间 |
| updatedAt | DateTime | Not Null | 更新时间 |

**索引**:
- `idx_slide_presentationId` ON (`presentationId`)
- `idx_slide_index` ON (`presentationId`, `index`)

**业务规则**:
- `index` 在同一 Presentation 内唯一
- 删除页面时需重新编排后续 index

---

### 3.6 ChatMessage（聊天消息表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 消息 ID |
| projectId | String | FK -> Project.id, Not Null | 所属项目 |
| role | String | Not Null | 角色：user/assistant/system |
| content | String | Not Null | 消息内容 |
| intent | String | Nullable | 意图：EDIT/ADD/SYSTEM |
| targetSlideIndex | Int | Nullable | 目标页码 |
| createdAt | DateTime | Not Null | 创建时间 |

**索引**:
- `idx_chat_projectId` ON (`projectId`)

---

### 3.7 AgentTrace（Agent 执行追踪表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 追踪 ID |
| projectId | String | FK -> Project.id, Not Null | 所属项目 |
| agentName | String | Not Null | Agent 名称 |
| phase | String | Not Null | 阶段：extraction/planning/writing/layout/visual/review |
| stepType | String | Not Null | 步骤类型：thought/action/observation |
| summary | String | Not Null | 摘要（人类可读） |
| payload | String | Nullable | 完整轨迹 JSON |
| createdAt | DateTime | Not Null | 创建时间 |

**索引**:
- `idx_tracer_projectId` ON (`projectId`)
- `idx_tracer_agentName` ON (`projectId`, `agentName`)

**业务规则**:
- 只保留最近 100 条记录，超出后删除最旧的
- payload 仅用于调试，生产环境不写入

---

### 3.8 Template（模板表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PK, UUID | 模板 ID |
| userId | String | FK -> User.id, Nullable | 所属用户（NULL 为系统模板） |
| name | String | Not Null | 模板名称 |
| category | String | Not Null | 分类：cover/toc/section/text/image/chart/diagram/dual/quote |
| tags | String | Nullable | 标签 JSON 数组 |
| svgContent | String | Not Null | SVG 骨架内容 |
| schemaJson | String | Not Null | Slot 定义 JSON |
| thumbnail | String | Nullable | 缩略图路径 |
| isBuiltIn | Boolean | Not Null, Default=false | 是否内置模板 |
| createdAt | DateTime | Not Null | 创建时间 |
| updatedAt | DateTime | Not Null | 更新时间 |

**索引**:
- `idx_template_userId` ON (`userId`)
- `idx_template_category` ON (`category`)

---

## 4. 文件存储规范

### 4.1 目录结构

```
/uploads
  /slides
    /{projectId}
      /{slideId}.png        # 幻灯片预览图
  /templates
    /{templateId}.svg       # 模板 SVG 文件
  /exports
    /{projectId}
      /{timestamp}.pptx    # 导出的 PPT 文件
```

### 4.2 清理策略

- 删除 Project 时，级联删除 `/uploads/slides/{projectId}` 目录
- 删除 Template 时，若有缩略图则一并删除
- 导出文件保留 7 天后自动清理

---

## 5. 迁移策略

### 5.1 第一阶段（SQLite）

```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 5.2 未来迁移 PostgreSQL

仅需修改 `datasource db.provider` 为 `"postgresql"`，其余 schema 完全兼容。

---

## 6. Prisma Schema 完整代码

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  nickname     String
  passwordHash String
  createdAt    DateTime  @default(now())
  lastLoginAt  DateTime?
  sessions     Session[]
  projects     Project[]
  templates    Template[]
}

model Session {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceFingerprint String
  expiresAt         DateTime
  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([deviceFingerprint])
}

model Project {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  status        String        @default("draft")
  coverSlideId  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  presentation  Presentation?
  chatMessages  ChatMessage[]
  agentTraces   AgentTrace[]

  @@index([userId])
  @@index([status])
}

model Presentation {
  id                String   @id @default(uuid())
  projectId         String   @unique
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title             String
  theme             String   @default("default")
  aspectRatio       String   @default("16:9")
  targetSlideCount  Int?
  actualSlideCount  Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  slides            Slide[]

  @@index([projectId])
}

model Slide {
  id              String       @id @default(uuid())
  presentationId  String
  presentation    Presentation @relation(fields: [presentationId], references: [id], onDelete: Cascade)
  index           Int
  templateId      String?
  title           String?
  subtitle        String?
  contentJson     String?
  visualType      String?
  generatedSvg    String?
  previewImage    String?
  status          String       @default("pending")
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([presentationId])
  @@index([presentationId, index])
}

model ChatMessage {
  id               String   @id @default(uuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  role             String
  content          String
  intent           String?
  targetSlideIndex Int?
  createdAt        DateTime @default(now())

  @@index([projectId])
}

model AgentTrace {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentName String
  phase     String
  stepType  String
  summary   String
  payload   String?
  createdAt DateTime @default(now())

  @@index([projectId])
  @@index([projectId, agentName])
}

model Template {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  category    String
  tags        String?
  svgContent  String
  schemaJson  String
  thumbnail   String?
  isBuiltIn   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([category])
}
```

---

## 7. 附录：状态枚举

| 模型 | 状态值 |
|------|--------|
| Project | draft / generating / waiting_outline_confirm / ready / exporting / error |
| Slide | pending / writing / visual_processing / rendered / revising / failed |
| ChatMessage.role | user / assistant / system |
| ChatMessage.intent | EDIT / ADD / SYSTEM |
