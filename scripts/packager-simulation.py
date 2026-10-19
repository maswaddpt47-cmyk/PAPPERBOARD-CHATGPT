"""Publie le prototype interactif autonome, avec les jetons réels de la charte."""
from pathlib import Path
import re
import json
import hashlib

root = Path(__file__).resolve().parent.parent
source = root / 'docs' / 'simulation'
style = (root / 'assets' / 'style.css').read_text()
light = re.search(r'^:root \{.*?^\}', style, re.M | re.S)
dark = re.search(r'^\[data-theme="dark"\] \.screen \{.*?^\}', style, re.M | re.S)
assert light and dark
tokens = light.group() + '\n' + dark.group().replace('[data-theme="dark"] .screen', '.projection-modal', 1)
(source / 'jetons.css').write_text(tokens + '\n')
html = (source / 'index.html').read_text()
html = html.replace('href="../../index.html"', 'href="index.html"')
for name in ['style.css', 'refinements.css', 'jetons.css', 'charte.css']:
    tag = '<link rel="stylesheet" href="' + name + '">'
    assert tag in html
    html = html.replace(tag, '<style>\n' + (source / name).read_text().replace('</style', '<\\/style') + '\n</style>')
for name in ['icons.js', '../../assets/qrcode.js', 'preparation-tools.js', 'app.js', 'tooltips.js']:
    tag = '<script src="' + name + '"></script>'
    assert tag in html
    html = html.replace(tag, '<script>\n' + (source / name).read_text().replace('</script', '<\\/script') + '\n</script>')
assert not re.search(r'<script[^>]+src=', html)
assert not re.search(r'<link[^>]+stylesheet', html)
assert "connect-src 'none'" in html
out = root / 'simulation.html'
out.write_text(html)
gallery = (root / 'docs' / 'galerie-resultats' / 'apercu-autonome.html').read_text()
(root / 'index.html').write_text(gallery.replace('href="../simulation/index.html"', 'href="simulation.html"'))
print(str(out) + ' : ' + str(out.stat().st_size) + ' octets')
reference_files = [
    'docs/simulation/index.html', 'docs/simulation/style.css',
    'docs/simulation/refinements.css', 'docs/simulation/jetons.css',
    'docs/simulation/charte.css', 'docs/simulation/icons.js',
    'docs/simulation/app.js', 'docs/simulation/preparation-tools.js',
    'docs/simulation/tooltips.js', 'assets/style.css', 'assets/qrcode.js',
    'simulation.html',
]
reference = {
    'viewports': [[1920, 1080], [1280, 720], [1024, 768], [390, 844]],
    'files': {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in reference_files},
}
(source / 'reference-ui.json').write_text(json.dumps(reference, ensure_ascii=False, indent=2) + '\n')
