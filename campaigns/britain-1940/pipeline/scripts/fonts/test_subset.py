"""Regression test for runtime text collection, independent of generated font files."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


module_spec = importlib.util.spec_from_file_location("font_subset", Path(__file__).with_name("subset.py"))
font_subset = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(font_subset)


class TextCollectionTest(unittest.TestCase):
    def test_decodes_runtime_scenario_and_lod_labels_and_keeps_latin(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "src").mkdir()
            (root / "src/main.ts").write_text("const label = '英伦';", encoding="utf-8")
            (root / "config").mkdir()
            # Escaped JSON exercises the same case as generated history/config fragments.
            (root / "config/scenario.json").write_text(json.dumps({"title": "祁罡", "original": "Luftflotte"}), encoding="utf-8")
            (root / "config/lod.json").write_text(json.dumps({"label": "鹭鹳"}), encoding="utf-8")
            with patch.object(font_subset, "ROOT", root):
                chars = font_subset.scan_chars()
                actual = font_subset.scan_chars(include_base=False)
            self.assertTrue(set("英伦祁罡鹭鹳Luftflotte") <= chars)
            self.assertTrue(set("英伦祁罡鹭鹳Luftflotte") <= actual)
            self.assertNotIn("ß", actual)
            self.assertTrue(set("ÄÖÜäöüßé") <= chars)


if __name__ == "__main__":
    unittest.main()
