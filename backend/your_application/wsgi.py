"""Compatibility WSGI entrypoint for deployments still using `your_application.wsgi`."""

import os

from django.core.wsgi import get_wsgi_application


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jewel_finance.settings")

application = get_wsgi_application()
