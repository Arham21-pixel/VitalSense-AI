from __future__ import annotations

try:
    from .extract_mimic_iv import main
except ImportError:  # pragma: no cover
    from extract_mimic_iv import main


if __name__ == "__main__":
    main()
