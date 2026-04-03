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

（文档继续，已移入此文件）