from src.core.app import create_application
from src.core.server import run_server
from src.utils.logging_config import setup_logging

setup_logging()

app = create_application()


def main():
    run_server()


if __name__ == "__main__":
    main()
