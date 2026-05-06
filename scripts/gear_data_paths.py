from pathlib import Path
import os


DEFAULT_DATA_ROOT = Path("/Users/tommy/GearSage-data")


def data_root() -> Path:
    return Path(os.environ.get("GEARSAGE_DATA_ROOT", DEFAULT_DATA_ROOT)).expanduser()


def from_root(env_name: str, *segments: str) -> Path:
    env_value = os.environ.get(env_name)
    if env_value:
        return Path(env_value).expanduser()
    return data_root().joinpath(*segments)


DATA_RAW_DIR = from_root("GEAR_DATA_RAW_DIR", "data_raw")
EXCEL_DIR = from_root("GEAR_EXCEL_DIR", "rate", "excel")
WEBP_DIR = from_root("GEAR_WEBP_DIR", "rate", "webp")
REPORT_DIR = from_root("GEAR_REPORT_DIR", "reports")
BACKUP_DIR = from_root("GEAR_BACKUP_DIR", "backups")


def resolve_data_raw(*segments: str) -> Path:
    return DATA_RAW_DIR.joinpath(*segments)


def resolve_excel(*segments: str) -> Path:
    return EXCEL_DIR.joinpath(*segments)


def resolve_webp(*segments: str) -> Path:
    return WEBP_DIR.joinpath(*segments)


def resolve_report(*segments: str) -> Path:
    return REPORT_DIR.joinpath(*segments)


def resolve_backup(*segments: str) -> Path:
    return BACKUP_DIR.joinpath(*segments)
