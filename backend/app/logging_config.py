import json
import logging
import os

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
LOG_PATH = os.path.join(LOG_DIR, "app.log")


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "dd.trace_id": record.__dict__.get("dd.trace_id", "0"),
            "dd.span_id": record.__dict__.get("dd.span_id", "0"),
            "dd.service": record.__dict__.get("dd.service", ""),
            "dd.env": record.__dict__.get("dd.env", ""),
            "dd.version": record.__dict__.get("dd.version", ""),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    os.makedirs(LOG_DIR, exist_ok=True)
    formatter = JSONFormatter()

    file_handler = logging.FileHandler(LOG_PATH)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(file_handler)
    root.addHandler(console_handler)
