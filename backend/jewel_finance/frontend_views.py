import mimetypes

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.views.decorators.http import require_safe


FRONTEND_OUT_DIR = settings.BASE_DIR.parent / "frontend" / "out"


def _is_frontend_file(path):
    try:
        path.resolve(strict=False).relative_to(FRONTEND_OUT_DIR.resolve(strict=False))
    except ValueError:
        return False

    return path.is_file()


def _get_frontend_file(path):
    normalized_path = str(path or "").strip("/")
    candidates = []

    if normalized_path:
        direct_file = FRONTEND_OUT_DIR / normalized_path
        candidates.append(direct_file)

        if not direct_file.suffix:
            candidates.append(direct_file / "index.html")
            candidates.append(FRONTEND_OUT_DIR / f"{normalized_path}.html")
    else:
        candidates.append(FRONTEND_OUT_DIR / "index.html")

    for candidate in candidates:
        if _is_frontend_file(candidate):
            return candidate

    path_parts = normalized_path.split("/") if normalized_path else []

    if path_parts[:3] == ["dashboard", "customers", "list"] and len(path_parts) == 4:
        dynamic_route_fallback = FRONTEND_OUT_DIR / "dashboard" / "customers" / "list" / "placeholder" / "index.html"

        if _is_frontend_file(dynamic_route_fallback):
            return dynamic_route_fallback

    if path_parts[:2] == ["dashboard", "customers"] and len(path_parts) == 3:
        dynamic_route_fallback = FRONTEND_OUT_DIR / "dashboard" / "customers" / "placeholder" / "index.html"

        if _is_frontend_file(dynamic_route_fallback):
            return dynamic_route_fallback

    if path_parts[:2] == ["dashboard", "transactions"] and len(path_parts) == 3:
        dynamic_route_fallback = FRONTEND_OUT_DIR / "dashboard" / "transactions" / "placeholder" / "index.html"

        if _is_frontend_file(dynamic_route_fallback):
            return dynamic_route_fallback

    not_found_page = FRONTEND_OUT_DIR / "404.html"

    if _is_frontend_file(not_found_page):
        return not_found_page

    raise Http404("Frontend file not found.")


def _build_file_response(file_path, *, status=200):
    content_type, encoding = mimetypes.guess_type(file_path.name)
    response = FileResponse(file_path.open("rb"), content_type=content_type or "application/octet-stream", status=status)

    if encoding:
        response["Content-Encoding"] = encoding

    if file_path.suffix == ".html":
        response["Cache-Control"] = "no-store"
    elif "/_next/static/" in file_path.as_posix():
        response["Cache-Control"] = "public, max-age=31536000, immutable"

    return response


@require_safe
def serve_frontend(request, path=""):
    if not FRONTEND_OUT_DIR.is_dir():
        return HttpResponse("Frontend build is unavailable.", status=503)

    file_path = _get_frontend_file(path)
    status = 404 if file_path.name == "404.html" and str(path or "").strip("/") else 200
    return _build_file_response(file_path, status=status)
