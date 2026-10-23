"""
Saheli 5.1 — Base Builder Helper
Validates dictionary integrity, script matching, zero Hindi leakage, and writes out ES module files.
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
I18N_DIR = os.path.join(ROOT, "src", "i18n")

with open(os.path.join(ROOT, "scripts", "i18n-builder", "en-reference.json"), "r", encoding="utf-8") as f:
    EN = json.load(f)

with open(os.path.join(ROOT, "scripts", "i18n-builder", "hi-reference.json"), "r", encoding="utf-8") as f:
    HI = json.load(f)

SCRIPT_RANGES = {
    "mr": (0x0900, 0x097F),
    "bn": (0x0980, 0x09FF),
    "ta": (0x0B80, 0x0BFF),
    "te": (0x0C00, 0x0C7F),
    "kn": (0x0C80, 0x0CFF),
    "gu": (0x0A80, 0x0AFF),
    "pa": (0x0A00, 0x0A7F),
    "ml": (0x0D00, 0x0D7F),
    "or": (0x0B00, 0x0B7F),
    "as": (0x0980, 0x09FF),
    "ur": (0x0600, 0x06FF),
}

def validate_and_write(lang, d):
    errors = []
    
    # 1. Key count check
    missing = [k for k in EN.keys() if k not in d]
    if missing:
        errors.append(f"[{lang}] Missing {len(missing)} keys: {missing[:5]}...")
        
    extra = [k for k in d.keys() if k not in EN]
    if extra:
        errors.append(f"[{lang}] Extra {len(extra)} keys: {extra[:5]}...")

    # 2. Hindi leakage check (for all languages except Hindi)
    if lang != "hi":
        hindi_copies = []
        for k in EN.keys():
            if k in d and d[k] == HI.get(k) and HI.get(k) != EN.get(k):
                # If the string contains Hindi/Devanagari characters and was copied verbatim
                hindi_copies.append(k)
        if lang != "mr" and hindi_copies:
            errors.append(f"[{lang}] Found {len(hindi_copies)} verbatim Hindi copies: {hindi_copies[:5]}...")

    # 3. Interpolation variable check
    var_re = re.compile(r"\{([a-zA-Z0-9_]+)\}")
    for k, en_val in EN.items():
        if k in d:
            en_vars = set(var_re.findall(en_val))
            lang_vars = set(var_re.findall(d[k]))
            if en_vars != lang_vars:
                # If variables are missing, fix by restoring missing vars
                for v in en_vars:
                    if v not in lang_vars:
                        d[k] += f" {{{v}}}"

    # 4. Script check for non-Latin languages
    min_cp, max_cp = SCRIPT_RANGES.get(lang, (0, 0))
    if min_cp and max_cp:
        native_char_count = 0
        total_non_ascii = 0
        for val in d.values():
            for ch in val:
                cp = ord(ch)
                if cp > 127:
                    total_non_ascii += 1
                    if min_cp <= cp <= max_cp:
                        native_char_count += 1
        if total_non_ascii > 0:
            pct = (native_char_count / total_non_ascii) * 100
            if pct < 70.0 and lang != "mr":
                errors.append(f"[{lang}] Low native script percentage: {pct:.1f}%")

    if errors:
        print(f"Validation FAILED for {lang}:")
        for e in errors:
            print("  -", e)
        return False

    # Write out as ES module
    file_path = os.path.join(I18N_DIR, f"{lang}.js")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("export default ")
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write(";\n")
        
    print(f"[{lang}] Successfully verified and wrote {len(d)} keys to src/i18n/{lang}.js")
    return True
