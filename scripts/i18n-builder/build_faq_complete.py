import json, re

# Let's read the original FAQ file
with open("src/content/faq.js", "r", encoding="utf-8") as f:
    orig = f.read()

# Let's extract original items
chunks = orig.split("  f(\n")[1:]

items = []
for ch in chunks:
    # item id
    m_id = re.search(r'^\s*"([^"]+)",', ch)
    item_id = m_id.group(1) if m_id else ""
    
    # kw
    m_kw = re.search(r'\[([^\]]+)\]', ch)
    kw_str = m_kw.group(1)
    kw = [x.strip().strip('"').strip("'") for x in kw_str.split(",") if x.strip()]
    
    # q
    m_q = re.search(r'\{\s*en:\s*("[^"]+"),\s*hi:\s*("[^"]+")\s*\}', ch)
    q_en = json.loads(m_q.group(1)) if m_q else ""
    q_hi = json.loads(m_q.group(2)) if m_q else ""
    
    # a
    m_a = re.search(r'\{\s*en:\s*("[^"]+"),\s*hi:\s*("[^"]+")\s*\}', ch[m_q.end():])
    a_en = json.loads(m_a.group(1)) if m_a else ""
    a_hi = json.loads(m_a.group(2)) if m_a else ""
    
    # src
    after_a = ch[m_q.end() + m_a.end():]
    m_src = re.search(r'\[([^\]]+)\]', after_a)
    src_str = m_src.group(1) if m_src else ""
    src = [x.strip().strip('"').strip("'") for x in src_str.split(",") if x.strip()]
    
    # concerning
    concerning = ", true" in after_a
    
    items.append({
        "id": item_id,
        "kw": kw,
        "q_en": q_en,
        "q_hi": q_hi,
        "a_en": a_en,
        "a_hi": a_hi,
        "src": src,
        "concerning": concerning
    })

print(f"Parsed {len(items)} FAQ items cleanly.")
