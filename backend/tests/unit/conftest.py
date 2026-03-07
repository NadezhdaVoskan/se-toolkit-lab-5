"""Unit-test configuration — runs before any test module is imported."""

import os

# The import chain (routers → database → settings) requires API_KEY.
# Unit tests never call the real API, so a dummy value is sufficient.
os.environ["API_KEY"] = "test"

# Force reload of settings module if it was already imported
import sys
if "app.settings" in sys.modules:
    del sys.modules["app.settings"]
if "app.auth" in sys.modules:
    del sys.modules["app.auth"]
if "app.main" in sys.modules:
    del sys.modules["app.main"]
