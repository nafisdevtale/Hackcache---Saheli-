#!/usr/bin/env python3
"""
Saheli 5.1 — Master Multilingual Translation Builder
Generates complete authentic dictionaries for all 11 Indian regional languages + Urdu.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
I18N_DIR = os.path.join(ROOT, "src", "i18n")

with open(os.path.join(ROOT, "scripts", "i18n-builder", "en-reference.json"), "r", encoding="utf-8") as f:
    EN = json.load(f)

with open(os.path.join(ROOT, "scripts", "i18n-builder", "hi-reference.json"), "r", encoding="utf-8") as f:
    HI = json.load(f)

print(f"Loaded {len(EN)} reference keys.")
