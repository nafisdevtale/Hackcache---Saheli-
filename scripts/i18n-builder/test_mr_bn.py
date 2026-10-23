#!/usr/bin/env python3
"""
Test script to generate and verify Marathi (mr) and Bengali (bn).
"""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
with open(os.path.join(ROOT, "scripts", "i18n-builder", "en-reference.json"), "r", encoding="utf-8") as f:
    EN = json.load(f)

print(f"Total keys to map: {len(EN)}")
