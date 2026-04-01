# PPT 自动生成 Web 系统 - 部署与运维方案

## 1. 概述

### 1.1 部署架构

```
用户浏览器 → Nginx (80/443) → Next.js App (3000) → SQLite + 本地文件存储
                                    ↓
                              LLM API (外部)
                              Unsplash API (外部)
```

### 1.2 部署环境

| 项目 | 要求 |
|------|------|
| 部署方式 | Docker 容器 + Docker Compose |
| 反向代理 | Nginx |
| 运行环境 | 企业内网 |
| 最低配置 | 4 核 CPU / 8 GB RAM / 50 GB 磁盘 |
| 推荐配置 | 8 核 CPU / 16 GB RAM / 100 GB SSD |
| 操作系统 | Linux (Ubuntu 22.04+ / CentOS 7+) |

---

## 2. Docker 镜像构建

### 2.1 Dockerfile

```dockerfile
# ---- 构建阶段 ----
FROM node:18-alpine AS builder

WORKDIR /app

# 安装系统依赖（sharp、resvg-js 需要）
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prisma 生成
RUN npx prisma generate

# Next.js 构建
RUN npm run build

# ---- 运行阶段 ----
FROM node:18-alpine AS runner

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache \
    # 中文字体支持
    font-noto-cjk \
    # sharp 运行时依赖
    vips-dev \
    # 时区
    tzdata

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# 拷贝构建产物
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2.2 .dockerignore

```
node_modules
.next
.git
*.md
docs/
interactive-prototypes/
.env.local
```

---

## 3. Docker Compose 编排

### 3.1 docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    container_name: ppt-agent
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    volumes:
      # SQLite 数据库持久化
      - ppt-data:/app/data
      # 上传文件持久化
      - ppt-uploads:/app/uploads
    environment:
      - DATABASE_URL=file:/app/data/production.db
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: ppt-agent-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./deploy/ssl:/etc/nginx/ssl:ro  # 可选：HTTPS 证书
    depends_on:
      app:
        condition: service_healthy

volumes:
  ppt-data:
    driver: local
  ppt-uploads:
    driver: local
```

### 3.2 环境变量文件 (.env.production)

```env
# === 必须配置 ===
JWT_SECRET=<至少32字符的随机字符串>
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat

# === 可选配置 ===
PORT=3000
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
UNSPLASH_ACCESS_KEY=
IMAGE_SEARCH_ENABLED=true
```

> **安全提醒**：`.env.production` 包含密钥，不要提交到 Git 仓库。

---

## 4. Nginx 配置

### 4.1 nginx.conf

```nginx
upstream ppt_app {
    server app:3000;
}

server {
    listen 80;
    server_name ppt.internal.example.com;

    # 可选：强制跳转 HTTPS
    # return 301 https://$host$request_uri;

    # 请求体大小限制（文件上传）
    client_max_body_size 60m;

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://ppt_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 上传文件代理（缩略图、导出文件）
    location /uploads/ {
        proxy_pass http://ppt_app;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # SSE 长连接
    location /api/v1/pipeline/ {
        proxy_pass http://ppt_app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;  # 10 分钟（匹配管线超时）
    }

    # API 和页面
    location / {
        proxy_pass http://ppt_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4.2 HTTPS 配置（可选）

若需 HTTPS，在 `server` 块中添加：

```nginx
server {
    listen 443 ssl;
    server_name ppt.internal.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其余配置同上
}
```

---

## 5. 部署操作

### 5.1 首次部署

```bash
# 1. 克隆代码
git clone <repo-url> ppt-agent
cd ppt-agent

# 2. 创建环境变量文件
cp .env.example .env.production
# 编辑 .env.production 填入实际配置

# 3. 创建 Nginx 配置
mkdir -p deploy/ssl
# 将 nginx.conf 放入 deploy/ 目录

# 4. 构建并启动
docker compose up -d --build

# 5. 初始化数据库
docker compose exec app npx prisma migrate deploy

# 6. 检查状态
docker compose ps
docker compose logs -f app
```

### 5.2 版本更新

```bash
# 1. 拉取新代码
git pull origin main

# 2. 重新构建并滚动更新
docker compose up -d --build

# 3. 运行数据库迁移（如有）
docker compose exec app npx prisma migrate deploy

# 4. 检查健康状态
docker compose ps
curl http://localhost/api/health
```

### 5.3 回滚

```bash
# 查看可用镜像
docker images ppt-agent

# 回退到上一版本
git checkout <previous-tag>
docker compose up -d --build
```

---

## 6. 数据备份

### 6.1 SQLite 备份

```bash
# 手动备份
docker compose exec app sqlite3 /app/data/production.db ".backup '/app/data/backup-$(date +%Y%m%d).db'"

# 自动备份脚本 (deploy/backup.sh)
#!/bin/bash
BACKUP_DIR="/opt/backups/ppt-agent"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# 备份数据库
docker compose exec -T app sqlite3 /app/data/production.db ".backup '/app/data/backup.db'"
docker compose cp app:/app/data/backup.db "$BACKUP_DIR/db-$TIMESTAMP.db"

# 备份上传文件
docker compose cp app:/app/uploads "$BACKUP_DIR/uploads-$TIMESTAMP"

# 清理 30 天前的备份
find "$BACKUP_DIR" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

### 6.2 备份策略

| 类型 | 频率 | 保留时间 |
|------|------|----------|
| SQLite 数据库 | 每天 02:00 | 30 天 |
| 上传文件 | 每周日 03:00 | 60 天 |

通过 crontab 配置自动备份：

```bash
# crontab -e
0 2 * * * /opt/ppt-agent/deploy/backup.sh >> /var/log/ppt-backup.log 2>&1
```

---

## 7. 健康检查与监控

### 7.1 健康检查端点

```
GET /api/health

响应：
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 86400,
  "database": "connected",
  "timestamp": "2026-04-01T12:00:00Z"
}
```

### 7.2 日志管理

**Docker 日志配置**：

```yaml
# docker-compose.yml 中添加
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
```

**查看日志**：

```bash
# 实时日志
docker compose logs -f app

# 最近 100 行
docker compose logs --tail 100 app

# 按时间筛选
docker compose logs --since "2026-04-01T00:00:00" app
```

### 7.3 磁盘监控

需要关注的目录大小：

| 路径 | 说明 | 告警阈值 |
|------|------|----------|
| `/app/data/production.db` | SQLite 数据库 | > 500 MB |
| `/app/uploads/cache/` | 图片缓存 | > 1 GB |
| `/app/uploads/slides/` | 幻灯片资源 | > 5 GB |
| `/app/uploads/exports/` | 导出文件 | > 2 GB |

**磁盘清理脚本**（deploy/cleanup.sh）：

```bash
#!/bin/bash

# 清理 24 小时前的图片缓存
docker compose exec -T app find /app/uploads/cache -mtime +1 -type f -delete

# 清理 7 天前的导出文件
docker compose exec -T app find /app/uploads/exports -mtime +7 -type f -delete

echo "Cleanup completed at $(date)"
```

---

## 8. 常见问题排查

### 8.1 容器无法启动

```bash
# 检查日志
docker compose logs app

# 检查端口占用
ss -tlnp | grep 3000

# 检查环境变量
docker compose exec app env | grep -E "^(LLM|JWT|DATABASE)"
```

### 8.2 数据库锁定

SQLite 使用 WAL 模式提高并发性能，但偶尔可能出现锁定：

```bash
# 检查锁状态
docker compose exec app sqlite3 /app/data/production.db "PRAGMA journal_mode;"
# 应返回 "wal"

# 若数据库锁定，检查是否有未关闭的连接
docker compose restart app
```

### 8.3 LLM 连接失败

```bash
# 从容器内测试 LLM 连通性
docker compose exec app wget -qO- --timeout=10 "$LLM_BASE_URL/models" || echo "Connection failed"
```

### 8.4 内存占用过高

```bash
# 查看容器资源使用
docker stats ppt-agent

# 可在 docker-compose.yml 中限制内存
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4g
```

---

## 9. 目录结构

部署相关文件的目录结构：

```
ppt-agent/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example            # 环境变量模板
├── .env.production         # 实际环境变量（不提交 Git）
├── deploy/
│   ├── nginx.conf          # Nginx 配置
│   ├── ssl/                # HTTPS 证书（可选）
│   ├── backup.sh           # 备份脚本
│   └── cleanup.sh          # 清理脚本
```
