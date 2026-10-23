import re

# 1. Fix missing comma in i18n files
langs = ["as", "bn", "gu", "kn", "ml", "mr", "or", "pa", "ta", "te", "ur"]
for l in langs:
    filepath = f"src/i18n/{l}.js"
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
    # Replace '"visit.localOnlyNotice": "..."\n\n  "learn.featuredGuide"' with comma
    fixed = re.sub(
        r'("visit\.localOnlyNotice":\s*"[^"]+")\s*\n\s*("learn\.featuredGuide")',
        r'\1,\n\n  \2',
        text
    )
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(fixed)
    print(f"Fixed syntax in {filepath}")

# 2. Fix sources in lessons.js for products
with open("src/content/lessons.js", "r", encoding="utf-8") as f:
    lessons_text = f.read()

# Replace unicef_hygiene with nhs_periods and mohfw_mhs
lessons_text = lessons_text.replace('"src": "unicef_hygiene"', '"src": "nhs_periods"')
with open("src/content/lessons.js", "w", encoding="utf-8") as f:
    f.write(lessons_text)
print("Fixed sources in lessons.js")
