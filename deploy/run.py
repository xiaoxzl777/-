"""悠行的启动器：在一个窗口里启动、管理三个服务，按 Ctrl+C 一起停止。

    python deploy/run.py dev     开发模式：Vite 开发服务器（改代码后页面自动刷新）+ spring-boot:run + AI 服务
    python deploy/run.py prod    部署模式：先打包前端和后端 jar，再由 nginx 提供页面、把 /api 反向代理给后端

三个服务的日志都显示在这个窗口里，每行前面带服务名。
只用 Python 标准库；双击 deploy 目录里的 dev.bat、prod.bat 也是运行这个文件。
"""
from __future__ import annotations

import hashlib
import io
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "tour-web"
SERVER = ROOT / "tour-server"
AI = ROOT / "ai-service"
NGINX_DIR = ROOT / "deploy" / "nginx"

# 各服务监听的端口，启动器用它们检查端口是否被占用、服务是否已启动。
# 端口定义在各服务自己的配置里，改端口时这里要一起改：
#   AI 服务 ai-service/app/config.py，后端 tour-server/src/main/resources/application.yml，
#   页面 tour-web/vite.config.ts（dev）和 deploy/nginx.conf（prod）
AI_PORT, SERVER_PORT, WEB_PORT = 7777, 777, 770
APP_URL = f"http://localhost:{WEB_PORT}"  # 页面入口，都启动好后在浏览器里打开
READY_TIMEOUT = 300  # 秒；第一次运行要下载依赖，会久一点

# nginx 官方 Windows 版。下面的 SHA-256 对应的压缩包已用 nginx 官方公钥验过签名
NGINX_VERSION = "1.30.5"
NGINX_SHA256 = "e5afe28b6a50bec92c478bfe1a4d3758206b80fb77159277bc5c4e88955c2a35"

WINDOWS = os.name == "nt"
VENV_PYTHON = AI / (".venv/Scripts/python.exe" if WINDOWS else ".venv/bin/python")
MVNW = SERVER / ("mvnw.cmd" if WINDOWS else "mvnw")
NPM = "npm.cmd" if WINDOWS else "npm"
NGINX = NGINX_DIR / "nginx.exe"

# 各服务的日志经启动器转发到窗口里：统一用 UTF-8、不带颜色控制符，窗口里才不会乱码
COMMON_ENV = {"NO_COLOR": "1"}
PYTHON_UTF8 = {"PYTHONUTF8": "1"}
JAVA_UTF8 = {"LOGGING_CHARSET_CONSOLE": "UTF-8"}


class LaunchError(Exception):
    """启动过程中要告诉用户的问题。"""


@dataclass
class Service:
    name: str                          # 日志前缀
    cwd: Path
    command: list[str]
    port: int                          # 能连上这个端口，就算启动好了
    env: dict[str, str] = field(default_factory=dict)
    process: Optional[subprocess.Popen] = None


def services_for(mode: str) -> list[Service]:
    """两种模式的服务清单：AI 服务一样，后端和页面服务器的跑法不同。
    页面服务器要把 /api 转发给后端，所以排在最后，启动器也按这个顺序等它们就绪。"""
    ai = Service("ai", AI, [str(VENV_PYTHON), "-m", "app"], AI_PORT, PYTHON_UTF8)
    if mode == "dev":
        return [
            ai,
            Service("server", SERVER, [str(MVNW), "-q", "spring-boot:run"], SERVER_PORT, JAVA_UTF8),
            Service("web", WEB, [NPM, "run", "dev"], WEB_PORT),
        ]
    jars = list((SERVER / "target").glob("tour-server-*.jar"))
    if not jars:
        raise LaunchError("没找到后端的 jar 包，打包可能没成功")
    jar = max(jars, key=lambda p: p.stat().st_mtime)  # 改过版本号时 target 里可能还留着旧的
    return [
        ai,
        Service("server", SERVER, ["java", "-jar", str(jar)], SERVER_PORT, JAVA_UTF8),
        # nginx 把启动目录当作根目录，nginx.conf 里的相对路径都相对于 deploy/nginx
        Service("nginx", NGINX_DIR, [str(NGINX), "-c", "../nginx.conf"], WEB_PORT),
    ]


# ---------- 输出 ----------

PRINT_LOCK = threading.Lock()


def say(text: str) -> None:
    with PRINT_LOCK:
        print(text, flush=True)


def forward_output(service: Service) -> None:
    """把一个服务的输出逐行加上前缀显示出来。"""
    prefix = f"[{service.name}]".ljust(9)
    for raw in service.process.stdout:
        say(prefix + raw.decode("utf-8", "replace").rstrip())


# ---------- 准备 ----------

def missing_requirements(mode: str) -> list[str]:
    """第一次运行前要准备好的东西，缺了就列出来。"""
    needs = [
        (VENV_PYTHON, "AI 服务的虚拟环境：在 ai-service 目录运行 python -m venv .venv，再 pip install -r requirements.txt"),
        (AI / ".env", "AI 服务的配置：把 ai-service/.env.example 复制为 .env，填上 DeepSeek 的 Key"),
        (SERVER / "src/main/resources/application-local.yml",
         "后端的数据库配置：把 application-local.yml.example 复制为 application-local.yml，填上 MySQL 账号密码"),
        (WEB / "node_modules", "前端依赖：在 tour-web 目录运行 npm install"),
    ]
    missing = [text for path, text in needs if not path.exists()]
    if mode == "prod" and not shutil.which("java"):
        missing.append("Java：部署模式用 java -jar 运行后端，请把 JDK 的 bin 目录加到 PATH")
    return missing


def port_open(port: int) -> bool:
    try:
        with socket.create_connection(("localhost", port), timeout=1):
            return True
    except OSError:
        return False


def check_ports_free() -> None:
    busy = [str(port) for port in (AI_PORT, SERVER_PORT, WEB_PORT) if port_open(port)]
    if busy:
        raise LaunchError(f"端口 {'、'.join(busy)} 已被占用：可能另一个模式还在运行，或者上次的服务没停干净")


def install_nginx() -> None:
    """第一次运行部署模式时，下载 nginx 官方 Windows 版，核对 SHA-256 后解压到 deploy/nginx。"""
    if NGINX_DIR.exists():
        raise LaunchError("deploy/nginx 目录不完整（没有 nginx.exe），删掉这个目录再运行，会重新下载")
    url = f"https://nginx.org/download/nginx-{NGINX_VERSION}.zip"
    say(f"下载 nginx {NGINX_VERSION}：{url}")
    try:
        with urllib.request.urlopen(url, timeout=120) as resp:
            data = resp.read()
    except OSError as e:
        raise LaunchError(f"下载 nginx 失败（{e}），检查网络后再试") from e
    if hashlib.sha256(data).hexdigest() != NGINX_SHA256:
        raise LaunchError("下载的 nginx 和官方发布的不一致（SHA-256 对不上），没有使用")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        archive.extractall(NGINX_DIR.parent)
    (NGINX_DIR.parent / f"nginx-{NGINX_VERSION}").rename(NGINX_DIR)


def stop_nginx() -> None:
    """让 nginx 自己退出。Windows 版 nginx 关掉窗口也不会退出，只能用 nginx -s stop。"""
    pid_file = NGINX_DIR / "logs" / "nginx.pid"
    if not pid_file.exists():
        return
    subprocess.run([str(NGINX), "-s", "stop", "-c", "../nginx.conf"], cwd=NGINX_DIR,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(25):  # 最多等 5 秒，退出后 pid 文件会被删掉
        if not pid_file.exists():
            return
        time.sleep(0.2)


def build() -> None:
    """部署模式先打包：前端打成 tour-web/dist，后端打成 tour-server/target 里的 jar。"""
    say("打包前端……")
    subprocess.run([NPM, "run", "build"], cwd=WEB, check=True)
    say("打包后端……")
    subprocess.run([str(MVNW), "-q", "-B", "package", "-DskipTests"], cwd=SERVER, check=True)


# ---------- 进程 ----------

def start(service: Service) -> None:
    # 每个服务单独一个进程组：Ctrl+C 只交给启动器，由启动器统一停止它们
    service.process = subprocess.Popen(
        service.command, cwd=service.cwd, env={**os.environ, **COMMON_ENV, **service.env},
        stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if WINDOWS else 0,
        start_new_session=not WINDOWS)
    threading.Thread(target=forward_output, args=(service,), daemon=True).start()


def stop(service: Service) -> None:
    process = service.process
    if process is None or process.poll() is not None:
        return
    if WINDOWS:
        # 结束整棵进程树：mvnw、npm 都会再启动子进程
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(process.pid)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        pass


def check_alive(services: list[Service]) -> None:
    for service in services:
        code = service.process.poll()
        if code is not None:
            raise LaunchError(f"{service.name} 退出了（退出码 {code}），原因看上面带 [{service.name}] 的日志")


def wait_until_ready(services: list[Service]) -> None:
    """按清单顺序等每个服务的端口能连上，最后经页面服务器请求一次后端接口，确认转发也是通的。"""
    deadline = time.monotonic() + READY_TIMEOUT
    for service in services:
        while not port_open(service.port):
            check_alive(services)
            if time.monotonic() > deadline:
                raise LaunchError(f"等了 {READY_TIMEOUT // 60} 分钟 {service.name} 还没启动好，看看上面带 [{service.name}] 的日志")
            time.sleep(1)
        say(f"{service.name} 已启动")

    local = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 访问本机不走代理
    for _ in range(5):
        try:
            with local.open(APP_URL + "/api/user/districts", timeout=5):
                return
        except OSError:
            time.sleep(1)
    raise LaunchError("页面能打开，但经页面服务器调不通后端接口：检查 /api 的转发配置和后端日志")


# ---------- 主流程 ----------

def run(mode: str, services: list[Service]) -> None:
    if mode == "prod":
        if not WINDOWS:
            raise LaunchError("部署模式目前只支持 Windows（用的是 nginx 官方 Windows 版）")
        if not NGINX.exists():
            install_nginx()
        stop_nginx()  # 上次直接关掉窗口的话，nginx 还在后台，先停掉
    check_ports_free()
    if mode == "prod":
        build()

    services.extend(services_for(mode))
    say(f"启动 {'、'.join(s.name for s in services)}，日志前面的 [名字] 表示来自哪个服务。")
    for service in services:
        start(service)
    wait_until_ready(services)
    say(f"\n都启动好了：{APP_URL}    按 Ctrl+C 停止全部服务\n")
    webbrowser.open(APP_URL)
    while True:
        check_alive(services)
        time.sleep(1)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode not in ("dev", "prod"):
        print(__doc__)
        return 2
    missing = missing_requirements(mode)
    if missing:
        print("还缺下面这些，准备好再运行（详见 README 的启动步骤）：")
        for text in missing:
            print("  - " + text)
        return 1

    services: list[Service] = []
    code = 0
    try:
        run(mode, services)
    except KeyboardInterrupt:
        pass
    except LaunchError as e:
        say(f"\n{e}")
        code = 1
    except subprocess.CalledProcessError:
        say("\n打包失败，看上面的报错")
        code = 1
    finally:
        if services:
            say("正在停止所有服务……")
            if mode == "prod":
                stop_nginx()
            for service in reversed(services):
                stop(service)
            say("都已停止。")
    return code


if __name__ == "__main__":
    sys.exit(main())
