# 城市文旅行程规划平台（毕业设计）

面向广州自由行游客的行程规划网站，网站名“悠行”。用户和 AI 助手“小萧”聊出行想法，小萧先分辨是闲聊还是要规划行程，再结合景点开放时间、路程和预算，排出一份当天走得通的行程。

## 技术栈

| 部分 | 目录 | 技术 | 端口 |
|---|---|---|---|
| 前端 | `tour-web` | React 19 + TypeScript + Vite + Ant Design | 770 |
| 后端 | `tour-server` | Spring Boot 3.5 + MyBatis + MySQL 8 | 777 |
| AI 服务 | `ai-service` | Python FastAPI + LangChain + LangGraph + DeepSeek | 7777 |

端口是固定的，被占用时直接报错，不会自动换。前端没用 77，因为浏览器会把 77 当成不安全端口拦掉。

浏览器只访问后端；后端把消息和景点数据交给 AI 服务，AI 服务识别意图、排行程、写小萧的回复。

## 当前进度

- [x] 前置设计：需求分析、数据库设计、接口文档、前端设计规范
- [x] 第一版：登录注册、景点浏览、和小萧对话（主动问候、意图识别、一日行程规划、接着说修改）、保存行程、后台维护景点
- [ ] 第二批：门票预约、多日行程、更聪明的对话修改
- [ ] 最后一批（可选）：游记社区

## 环境要求

- JDK 17 或以上（不用装 Maven，项目自带 Maven Wrapper）
- Node.js 20.19 以上或 22.12 以上
- Python 3.10 以上
- MySQL 8

## 启动步骤

### 一键启动（Windows）

第一次在新电脑上运行前，先按下面的 1–4 步装好依赖、填好配置，只用做一次。之后双击项目根目录的 `start.bat`：

- 会打开三个窗口，分别运行 AI 服务（7777）、后端（777）、前端（770）；
- 后端启动好后，自动打开浏览器 http://localhost:770；
- 关掉对应的窗口，就停止那个服务。

缺依赖、缺配置文件或者端口被占用时，脚本会列出来，处理好再运行。脚本里的提示用英文：cmd 读含中文的批处理文件会错行。

### 手动启动

三个部分各开一个终端，按下面顺序启动。以下命令以 Windows 为例。

### 1. 配置数据库

复制 `tour-server/src/main/resources/application-local.yml.example`，改名为 `application-local.yml`，填上本机 MySQL 的账号和密码。这个文件不会提交到 git。

不用手动建库：后端第一次启动时会自动创建 `tour_planner` 库和表，并导入示例数据，不会动其他库。

### 2. 启动 AI 服务

先复制 `ai-service/.env.example`，改名为 `.env`，填上 DeepSeek 的 Key（`DEEPSEEK_API_KEY=sk-...`）。这个文件不会提交到 git。

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 7777
```

访问 http://localhost:7777/health 可以看到小萧能不能用（Key 是否有效、余额）。

### 3. 启动后端

```bash
cd tour-server
.\mvnw.cmd spring-boot:run
```

第一次运行会下载 Maven 和依赖，时间稍长。看到 `Started TourServerApplication` 就启动好了。

### 4. 启动前端

```bash
cd tour-web
npm install
npm run dev
```

打开 http://localhost:770。

## 账号

- 游客：在网站上自己注册。
- 管理员：打开 `/admin/login`，账号 `admin`，密码 `88888888`（写在 `application.yml` 的 `tour.admin` 里，不存数据库）。

## 测试

```bash
# AI 服务：小萧的流程图（用假模型代替 DeepSeek，不联网）、排程、校验、报错处理、接口
cd ai-service
.venv\Scripts\python -m pytest

# 后端：令牌权限、参数校验、AI 服务出错时给用户的提示（不需要数据库和 AI 服务）
cd tour-server
.\mvnw.cmd test

# 前端：类型检查并打包
cd tour-web
npm run build
```

## 常见问题

- **小萧说“暂时不在线”**：AI 服务没启动，或者 7777 端口被占用。
- **提示端口被占用**：先关掉之前打开的窗口。还不行的话，用 `netstat -ano | findstr :777` 查出占用端口的进程号，在任务管理器里确认是什么程序。
- **小萧说“暂时不能用了”**：DeepSeek 的 Key 无效或余额不足，后台顶部也会有提醒。
- **小萧说“请求超时了”**：DeepSeek 响应慢或网络不稳，点重试就行；经常超时可以把 `ai-service/.env` 里的 `DEEPSEEK_TIMEOUT` 调大一点。
- **后端启动报 Access denied**：`application-local.yml` 里的 MySQL 账号密码不对。
- **npm 或 pip 下载慢**：可以换国内镜像，比如 `npm config set registry https://registry.npmmirror.com`、`pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`。

## 文档

| 文档 | 内容 |
|---|---|
| [需求分析](docs/需求分析.md) | 角色、功能、AI 助手小萧的设定（主动问候、意图识别、边界）、业务规则 |
| [数据库设计](docs/数据库设计.md) | 第一版 7 张表 |
| [接口文档](docs/接口文档.md) | 后端分层、用户端和管理端接口、Python AI 服务 |
| [前端设计规范](docs/前端设计规范.md) | 颜色、字体、插画、小萧形象、动效、页面布局 |
| [风格预览](docs/design/清新文旅风-精修版.html) | 早期的风格预览，下载后用浏览器打开（内容是杭州，仅用于展示风格） |
