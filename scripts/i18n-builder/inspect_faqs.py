import re

with open("src/content/faq.js") as f:
    text = f.read()

# Let's see the structure of matchFaq and SUGGESTED at the bottom of the file
lines = text.split("\n")
print("Total lines:", len(lines))
for i, l in enumerate(lines[-60:]):
    print(i, l)
