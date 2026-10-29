#!/usr/bin/env python3
"""Archives a release as a static copy in releases/<version>/ so it can be opened from Réglages > Application.
Usage: python3 tools/archive.py <version> [source_dir]   (source_dir defaults to the repo root)
Also makes sure <version> is listed in window.RELEASES in version.js (newest first)."""
import sys,os,re,shutil
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ver=sys.argv[1];src=os.path.abspath(sys.argv[2]) if len(sys.argv)>2 else root
dst=f"{root}/releases/{ver}"
FILES=['index.html','styles.css','data-ex.js','data-sessions.js','version.js','store.js','app.js','views.js']
shutil.rmtree(dst,ignore_errors=True);os.makedirs(dst)
for f in FILES:shutil.copy(f"{src}/{f}",f"{dst}/{f}")
h=open(f"{dst}/index.html",encoding='utf-8').read()
h=h.replace('href="manifest.webmanifest"','href="../../manifest.webmanifest"').replace('href="icons/','href="../../icons/')
h=h.replace('<script src="data-ex.js">','<script src="../archive-banner.js"></script>\n<script src="data-ex.js">',1)
open(f"{dst}/index.html",'w',encoding='utf-8').write(h)
for f in ('app.js','views.js'):  # PDFs live at the site root
    t=open(f"{dst}/{f}",encoding='utf-8').read().replace('href="print/','href="../../print/')
    open(f"{dst}/{f}",'w',encoding='utf-8').write(t)
# list the release in the root version.js
vp=f"{root}/version.js";v=open(vp,encoding='utf-8').read()
m=re.search(r"window\.RELEASES=\[([^\]]*)\];?",v)
cur=[x.strip().strip("'") for x in m.group(1).split(',') if x.strip()] if m else []
if ver not in cur:cur.append(ver)
cur.sort(key=lambda x:[int(p) for p in x.split('.')],reverse=True)
line="window.RELEASES=["+",".join("'"+x+"'" for x in cur)+"];"
v=v.replace(m.group(0),line) if m else v.rstrip('\n')+"\n"+line+"\n"
open(vp,'w',encoding='utf-8').write(v)
print('archived',ver,'->',dst)
