# 城市文旅行程规划平台（毕业设计）

面向广州自由行游客的行程规划网站，网站名“悠行”。用户和 AI 助手“小萧”聊出行想法，小萧先分辨是闲聊还是要规划行程，再结合景点开放时间、路程和预算，排出一份当天走得通的行程。

## 架构

三个独立的项目，前后端分离：前端只通过 `/api` 下的 JSON 接口和后端通信，登录靠 JWT 令牌；后端把消息和景点数据交给 AI 服务，AI 服务识别意图、排行程、写小萧的回复。

| 部分 | 目录 | 技术 | 端口 |
|---|---|---|---|
| 前端 | `tour-web` | React 19 + TypeScript + Vite + Ant Design | 770 |
| 后端 | `tour-server` | Spring Boot 3.5 + MyBatis + MySQL 8 | 777 |
| AI 服务 | `ai-service` | Python FastAPI + LangChain + LangGraph + DeepSeek | 7777 |

有两种运行方式，只差前端和后端怎么跑：

```
开发模式：浏览器 → Vite(770)：页面 + 把 /api 转给后端 → 后端(777) → AI 服务(7777)
部署模式：浏览器 → nginx(770)：打包好的页面 + 把 /api 反向代理给后端 → 后端 jar(777) → AI 服务(7777)
```

```
graduate-project/
├─ tour-web/      前端
├─ tour-server/   后端
├─ ai-service/    AI 服务（小萧）
├─ deploy/        运行和部署：启动器 run.py、双击入口 dev.bat / prod.bat、nginx 配置
└─ docs/          需求分析、数据库设计、接口文档、前端设计规范
```

## 配置在哪

每项配置都有明确的归属，代码和提示文案里不写端口。

| 配置 | 位置 |
|---|---|
| 前端开发端口 770、`/api` 转发给 777 | `tour-web/vite.config.ts` |
| 部署时的页面端口 770、`/api` 反向代理给 777 | `deploy/nginx.conf` |
| 后端端口 777、AI 服务地址、管理员账号、JWT | `tour-server/src/main/resources/application.yml` |
| MySQL 账号密码 | `tour-server/src/main/resources/application-local.yml`（不入库） |
| AI 服务端口 7777、DeepSeek 设置的默认值 | `ai-service/app/config.py` |
| DeepSeek 的 Key，以及要覆盖默认值的设置 | `ai-service/.env`（不入库） |

端口是固定的，被占用时直接报错，不会自动换。端口会同时出现在“监听的一方”和“调用它的一方”的配置里，改的时候要一起改：比如后端的 777，要改 `application.yml`、`vite.config.ts`、`deploy/nginx.conf`，还有 `deploy/run.py` 开头的端口（启动器用它检查端口、等服务就绪）。前端没用 77，因为浏览器会把 77 当成不安全端口拦掉。

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

## 第一次运行前的准备

在新电脑上只用做一次：

1. **数据库**：复制 `tour-server/src/main/resources/application-local.yml.example`，改名为 `application-local.yml`，填上本机 MySQL 的账号和密码。不用手动建库，后端第一次启动时会自动创建 `tour_planner` 库和表，并导入示例数据，不会动其他库。
2. **AI 服务**：复制 `ai-service/.env.example`，改名为 `.env`，填上 DeepSeek 的 Key（`DEEPSEEK_API_KEY=sk-...`）。再建虚拟环境、装依赖：

   ```bash
   cd ai-service
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   ```

3. **前端**：在 `tour-web` 目录运行 `npm install`。

后端不用准备：项目自带 Maven Wrapper，第一次启动时会自动下载 Maven 和依赖。

## 启动和停止

| 模式 | 双击 | 或者在项目根目录运行 | 用途 |
|---|---|---|---|
| 开发 | `deploy/dev.bat` | `python deploy/run.py dev` | 平时写代码：改前端代码后页面自动刷新 |
| 部署 | `deploy/prod.bat` | `python deploy/run.py prod` | 演示、截图：先打包，再由 nginx 提供页面 |

- 三个服务的日志显示在同一个窗口里，每行前面的 `[ai]` `[server]` `[web]` `[nginx]` 表示来自哪个服务。
- 都启动好后，会自动打开浏览器 http://localhost:770。
- **按 Ctrl+C 停止全部服务**。双击启动的，停止后如果问“终止批处理操作吗”，按 Y 关掉窗口。直接关掉窗口也会停止。
- 两种模式都用 770 端口，同一时间只能运行一种。
- 启动前会先检查依赖、配置文件和端口，缺了或被占用会直接说明。

**部署模式和 nginx**

- nginx 放在 `deploy/nginx`，不提交到 git。第一次运行部署模式时，会从 nginx.org 下载官方 Windows 版 1.30.5，核对 SHA-256 后解压。
- `deploy/nginx.conf` 主要做了这几件事：
  - 提供 `tour-web/dist` 里打包好的页面；
  - 刷新 `/chat`、`/trips/1` 这类前端路由时返回 `index.html`，交给 React 处理；
  - 把 `/api` 反向代理给后端 777，最多等 75 秒，给小萧规划留足时间；
  - js、css 缓存 30 天，`index.html` 不缓存，并开启 gzip 压缩。
- Windows 版 nginx 不会跟着窗口退出，启动器会用 `nginx -s stop` 停它；万一上次没停掉，下次启动部署模式时会先把它停掉。
- nginx 的日志在 `deploy/nginx/logs`。

**单独启动某一个服务**（调试时用，各开一个终端）

```bash
# AI 服务
cd ai-service
.venv\Scripts\python -m app

# 后端
cd tour-server
.\mvnw.cmd spring-boot:run

# 前端开发服务器
cd tour-web
npm run dev
```

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

- **启动器说端口被占用**：多半是另一个模式还在运行，先把它停掉。还不行的话，用 `netstat -ano | findstr :777` 查出占用端口的进程号，在任务管理器里确认是什么程序。
- **启动器说某个服务退出了**：往上翻，看这个服务名开头的日志里的报错。
- **后端启动报 Access denied**：`application-local.yml` 里的 MySQL 账号密码不对。
- **小萧说“暂时不在线”**：AI 服务没在运行，看 `[ai]` 开头的日志。
- **小萧说“暂时不能用了”**：DeepSeek 的 Key 无效或余额不足，后台顶部也会有提醒。
- **小萧说“请求超时了”**：DeepSeek 响应慢或网络不稳，点重试就行；经常超时可以把 `ai-service/.env` 里的 `DEEPSEEK_TIMEOUT` 调大一点。
- **npm 或 pip 下载慢**：可以换国内镜像，比如 `npm config set registry https://registry.npmmirror.com`、`pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`。

## 文档

| 文档 | 内容 |
|---|---|
| [需求分析](docs/需求分析.md) | 角色、功能、AI 助手小萧的设定（主动问候、意图识别、边界）、业务规则 |
| [数据库设计](docs/数据库设计.md) | 第一版 7 张表 |
| [接口文档](docs/接口文档.md) | 后端分层、用户端和管理端接口、Python AI 服务 |
| [前端设计规范](docs/前端设计规范.md) | 颜色、字体、插画、小萧形象、动效、页面布局 |
| [风格预览](docs/design/清新文旅风-精修版.html) | 早期的风格预览，下载后用浏览器打开（内容是杭州，仅用于展示风格） |
