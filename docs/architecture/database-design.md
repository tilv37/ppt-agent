# PPT 自动生成 Web 系统 - 数据库详细设计
## 1. 概述
### 1.1 技术选型
**ORM**: Prisma
**数据库引擎**: SQLite（第一阶段），架构设计预留 PostgreSQL 迁移能力
**文件存储**: 本地磁盘（`/uploads` 目录）
### 1.2 设计原则
单设备单用户：用户注册后通过设备指纹绑定，跨设备登录同一账号
不保留历史版本快照，只保留最新状态
所有表需包含 `createdAt` / `updatedAt` 审计字段
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
删除 Project 时，级联删除 `/uploads/slides/{projectId}` 目录
删除 Template 时，若有缩略图则一并删除
导出文件保留 7 天后自动清理
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
	updatedAt   DateTime @default(now())

	@@index([userId])
	@@index([category])
}
```
## 7. 附录：状态枚举
| 模型 | 状态值 |
|------|--------|
| Project | draft / generating / waiting_outline_confirm / ready / exporting / error |
| Slide | pending / writing / visual_processing / rendered / revising/failed |
| ChatMessage.role | user / assistant / system |
| ChatMessage.intent | EDIT / ADD / SYSTEM |