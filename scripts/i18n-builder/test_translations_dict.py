import json

# Check item IDs
with open("scripts/i18n-builder/faq_extracted.json") as f:
    faqs = json.load(f)

for f in faqs:
    print(f["id"], "->", f["q"]["en"])
