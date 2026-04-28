from django.test import SimpleTestCase


def read_streaming_response(response):
    return b"".join(response.streaming_content)


class FrontendRouteTests(SimpleTestCase):
    def test_root_serves_exported_frontend(self):
        response = self.client.get("/", secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        self.assertIn(b"Jewel Finance Login", read_streaming_response(response))

    def test_dashboard_route_serves_exported_frontend(self):
        response = self.client.get("/dashboard", secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        self.assertIn(b"Loading dashboard", read_streaming_response(response))

    def test_dynamic_dashboard_route_uses_placeholder_export(self):
        response = self.client.get("/dashboard/customers/123", secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        self.assertIn(b"Loading customer page", read_streaming_response(response))

    def test_api_route_keeps_existing_backend_behavior(self):
        response = self.client.get("/api/csrf/", secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
