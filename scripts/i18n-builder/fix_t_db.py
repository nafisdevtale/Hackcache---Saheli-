with open("scripts/i18n-builder/generate_faq_complete.py", "r") as f:
    code = f.read()

code = code.replace("def localize_item(item):", "t_db = {}\ndef localize_item(item):")
with open("scripts/i18n-builder/generate_faq_complete.py", "w") as f:
    f.write(code)

