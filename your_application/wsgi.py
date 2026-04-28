"""Compatibility WSGI entrypoint for deployments still using `your_application.wsgi`."""

import os
import sys
from pathlib import Path

from django.core.wsgi import get_wsgi_application


CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jewel_finance.settings")

application = get_wsgi_application()
