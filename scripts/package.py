#!/usr/bin/env python3
"""Archive FTP reproductible, sans configuration locale ni données de participants."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parent.parent
with ZipFile(root/'wooclight.zip','w',ZIP_DEFLATED) as archive:
 for path in sorted((root/'wooclight').rglob('*')):
  if not path.is_file() or path.name=='config.php':continue
  rel=path.relative_to(root/'wooclight')
  if rel.parts[0]=='data' and rel.name not in ('.htaccess','index.php'):continue
  archive.write(path,path.relative_to(root))
 archive.writestr('wooclight/config.php',(root/'wooclight/config.sample.php').read_text())
print('wooclight.zip créé (configuration vierge, données exclues)')
