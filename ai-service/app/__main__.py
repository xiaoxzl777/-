"""启动 AI 服务：在 ai-service 目录下运行 python -m app，端口见 config.py 里的 Settings.port。"""
import uvicorn

from .config import load_settings
from .main import app


def main() -> None:
    # 只在本机监听：AI 服务只给后端调用，不对外开放
    uvicorn.run(app, host="127.0.0.1", port=load_settings().port)


if __name__ == "__main__":
    main()
