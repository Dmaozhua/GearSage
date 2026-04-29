import argparse
import subprocess
import sys
from pathlib import Path


DEFAULT_XLSX = Path("/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx")
DEFAULT_FACTS = Path("/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_variant_usage_facts.json")
DEFAULT_REPORT = Path("/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_usage_consistency_report.json")


def run(cmd):
    print("+", " ".join(str(part) for part in cmd))
    subprocess.run(cmd, check=True)


def main():
    parser = argparse.ArgumentParser(description="Build usage facts and enforce rod usage consistency before export.")
    parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    parser.add_argument("--facts", type=Path, default=DEFAULT_FACTS)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--source-label", default="rod_import")
    parser.add_argument("--no-fail-on-error", action="store_true")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    python = sys.executable
    run([
        python,
        str(root / "extract_rod_variant_usage_facts.py"),
        "--xlsx",
        str(args.xlsx),
        "--output",
        str(args.facts),
        "--source-label",
        args.source_label,
    ])
    cmd = [
        python,
        str(root / "validate_rod_usage_consistency.py"),
        "--xlsx",
        str(args.xlsx),
        "--facts",
        str(args.facts),
        "--report",
        str(args.report),
    ]
    if not args.no_fail_on_error:
        cmd.append("--fail-on-error")
    run(cmd)


if __name__ == "__main__":
    main()
