#!/usr/bin/env python3
"""
Saheli 5.1 — Master Multilingual Translation Builder
Generates complete authentic dictionaries for all 11 Indian regional languages + Urdu
and updates all medical educational content across all 13 languages.
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
I18N_DIR = os.path.join(ROOT, "src", "i18n")
CONTENT_DIR = os.path.join(ROOT, "src", "content")

with open(os.path.join(ROOT, "scripts", "i18n-builder", "en-reference.json"), "r", encoding="utf-8") as f:
    EN = json.load(f)

with open(os.path.join(ROOT, "scripts", "i18n-builder", "hi-reference.json"), "r", encoding="utf-8") as f:
    HI = json.load(f)

# Script ranges for verification
SCRIPT_RANGES = {
    "mr": (0x0900, 0x097F), # Devanagari
    "bn": (0x0980, 0x09FF), # Bengali
    "ta": (0x0B80, 0x0BFF), # Tamil
    "te": (0x0C00, 0x0C7F), # Telugu
    "kn": (0x0C80, 0x0CFF), # Kannada
    "gu": (0x0A80, 0x0AFF), # Gujarati
    "pa": (0x0A00, 0x0A7F), # Gurmukhi
    "ml": (0x0D00, 0x0D7F), # Malayalam
    "or": (0x0B00, 0x0B7F), # Odia
    "as": (0x0980, 0x09FF), # Assamese
    "ur": (0x0600, 0x06FF), # Arabic / Perso-Arabic
}

print(f"Total keys to generate per language: {len(EN)}")
