import json, re

# Let's inspect the current items to make sure we have all 32 IDs, src, concerning, and texts
with open("src/content/faq.js") as f:
    orig = f.read()

# We can parse the 32 items
pattern = r'f\(\s*"([^"]+)",\s*(\[[^\]]+\]),\s*(\{.*?\}),\s*(\{.*?\}),\s*(\[[^\]]+\])(?:,\s*(true|false))?\s*\)'
matches = re.findall(pattern, orig, re.DOTALL)
print(f"Found {len(matches)} FAQ items via regex")
