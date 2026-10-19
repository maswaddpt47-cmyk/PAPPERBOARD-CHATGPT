"""Construit l'aperçu autonome à partir des vrais rendus, sans serveur ni réseau."""
from pathlib import Path
import re


root = Path(__file__).resolve().parent.parent
gallery = root / 'docs' / 'galerie-resultats'
html = (gallery / 'index.html').read_text()
css = (root / 'assets/style.css').read_text() + '\n' + (gallery / 'galerie.css').read_text()
html = html.replace('<link rel="stylesheet" href="../../assets/style.css">',
                    '<style>\n' + css.replace('</style', '<\\/style') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="galerie.css">', '')
scripts = (
    ('../../assets/common.js', root / 'assets/common.js'),
    ('../../assets/charts.js', root / 'assets/charts.js'),
    ('galerie.js', gallery / 'galerie.js'),
)
for url, source in scripts:
    content = source.read_text().replace('</script', '<\\/script')
    tag = '<script src="' + url + '"></script>'
    assert tag in html, source
    html = html.replace(tag, '<script>\n' + content + '\n</script>')
policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + policy + '">')
assert not re.search(r'<script[^>]+src=', html)
assert not re.search(r'<link[^>]+stylesheet', html)
out = gallery / 'apercu-autonome.html'
out.write_text(html)
print(str(out) + ' : ' + str(out.stat().st_size) + ' octets')
