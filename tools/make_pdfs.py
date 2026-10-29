#!/usr/bin/env python3
"""Generates printable A4 landscape PDFs (one per session) from data-ex.js and data-sessions.js.
Usage: python3 tools/make_pdfs.py   (needs node and playwright with chromium)"""
import json,subprocess,os,html,re,datetime
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data=json.loads(subprocess.run(['node',root+'/tools/dump.js'],capture_output=True,text=True,check=True).stdout)
EX,SESS={k:v for k,v in data['EX'].items()},{s['id']:s for s in data['SESSIONS']}
ver=re.search(r"'([^']+)'",open(root+'/version.js').read()).group(1)
today=datetime.date.today().strftime('%d.%m.%Y')
e=lambda s:html.escape(str(s))
CSS="""
@page{size:A4 landscape;margin:10mm 11mm}
*{box-sizing:border-box}body{font:9.5pt/1.25 'Liberation Sans',Arial,Helvetica,sans-serif;color:#111;margin:0}
h1{font-size:19pt;margin:0}.sub{color:#444;margin:1mm 0 2mm}
.meta{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5pt solid #111;padding-bottom:2mm;margin-bottom:2.5mm}
.legend{font-size:8pt;color:#333}.fields{font-size:10pt}.fields span{display:inline-block;border-bottom:.7pt solid #111;width:34mm;margin:0 4mm 0 1.5mm}
.wu{border:.8pt solid #888;border-radius:2mm;padding:1.6mm 2.5mm;margin-bottom:2mm;font-size:9pt}
.wu b{margin-right:2mm}.wu .it{display:inline-block;margin-right:5mm;white-space:nowrap}
.cb{display:inline-block;width:3.2mm;height:3.2mm;border:.8pt solid #111;vertical-align:-.5mm;margin-right:1.2mm}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{font-size:8pt;text-transform:uppercase;letter-spacing:.04em;text-align:left;border-bottom:1pt solid #111;padding:1mm 1.2mm}
td{border-bottom:.6pt solid #999;padding:.9mm 1.2mm;vertical-align:top}
tr.st td{border-top:1pt solid #111}
.n{font-weight:700;font-size:12pt;text-align:center}
.en{font-weight:700;font-size:10.5pt}.fr{color:#444;font-style:italic;font-size:8.5pt}
.obj{font-weight:700;font-size:11pt;white-space:nowrap}.rest{font-size:8.5pt;color:#444}
.cue{font-size:8pt;color:#333;margin-top:.8mm}
.set{border:.8pt solid #555;border-radius:1.2mm;height:9.8mm;position:relative;margin:0 .6mm}
.set i{position:absolute;left:0;right:0;top:50%;border-top:.5pt solid #bbb}
.set u{position:absolute;right:1mm;font-size:6pt;color:#666;text-decoration:none}.set u.a{top:.6mm}.set u.b{bottom:.6mm}
.set.off{background:#eee;border-color:#bbb}
.sets{display:flex}.sets>div{flex:1}
.foot{position:fixed;bottom:0;left:0;right:0;font-size:7.5pt;color:#555;display:flex;justify-content:space-between;border-top:.5pt solid #bbb;padding-top:1mm}
"""
def setbox(n,total,kind):
    if n>=total:return '<div><div class="set off"></div></div>'
    if kind in('tick',):return '<div><div class="set"><span style="position:absolute;left:1.5mm;top:3.5mm"><span class="cb"></span></span></div></div>'
    if kind=='reps':return '<div><div class="set"><u class="a">reps</u></div></div>'
    return '<div><div class="set"><i></i><u class="a">reps</u><u class="b">kg</u></div></div>'
def rows(sess):
    out=[];maxn=max(it['sets'] for st in sess['stations'] if not st[0].get('warm') for it in st)
    num=0
    for si,st in enumerate(sess['stations']):
        if st[0].get('warm'):continue  # warm-up is printed as a strip above the table
        num+=1
        for k,it in enumerate(st):
            ex=EX[it['ex']];cls=' class="st"' if k==0 else ''
            lab=(str(num)+('ab'[k] if len(st)>1 else '')) 
            note=it.get('note') or ex.get('note') or ''
            cue=ex['cues'][0]
            obj=f"{it['sets']} × {it['reps']}" if (it['sets']>1 or ex['kind']!='tick') else it['reps']
            rest=f"repos {it['rest']} s" if it['rest'] else ''
            boxes=''.join(setbox(n,it['sets'],ex['kind']) for n in range(maxn))
            out.append(f"<tr{cls}><td class='n'>{lab}</td><td><div class='en'>{e(ex['en'])}</div><div class='fr'>{e(ex['fr'])}</div><div class='cue'>{e(note or cue)}</div></td>"
                       f"<td><div class='obj'>{e(obj)}</div><div class='rest'>{rest}</div></td><td><div class='sets'>{boxes}</div></td></tr>")
    return ''.join(out),maxn
def page(sid,warm):
    s=SESS[sid];body,maxn=rows(s)
    heads=''.join(f"<th style='text-align:center'>S{i+1}</th>" for i in range(maxn))
    wu=''
    if warm:
        items=''.join(f"<span class='it'><span class='cb'></span>{e(EX[it['ex']]['en'])} <span style='color:#555'>({e(it['reps'])})</span></span>" for st in s['stations'] if st[0].get('warm') for it in st)
        wu=f"<div class='wu'><b>Échauffement 6 min</b>{items}</div>"
    w=f"<table><colgroup><col style='width:9mm'><col style='width:92mm'><col style='width:28mm'><col></colgroup><tr><th></th><th>Exercice</th><th>Objectif</th><th><div class='sets'>{heads.replace('th','div')}</div></th></tr>{body}</table>"
    return f"""<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>
<div class='meta'><div><h1>{e(s['title'])}</h1><div class='sub'>{e(s['sub'])}</div><div class='legend'>S1–S{maxn} = séries 1 à {maxn} (note les reps et les kg). Case grise = série non prévue. Lettres a / b = superset : alterne les deux exercices.</div></div>
<div class='fields'>Date<span></span>Semaine<span style='width:14mm'></span></div></div>{wu}{w}
<div class='foot'><span>Charge : laisse 2 reps en réserve. Toutes les séries au haut de la fourchette 2 séances de suite : +2.5–5 %. Douleur tendon ou articulation à 4/10 ou plus : saute l’exercice.</span><span>Gym Guide {e(ver)} · imprimé le {today}</span></div></body></html>"""
files={'a':('seance-a.pdf',True),'b':('seance-b.pdf',True),'c':('seance-c.pdf',True),'home':('routine-maison.pdf',False)}
from playwright.sync_api import sync_playwright
os.makedirs(root+'/print',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page()
    for sid,(fn,warm) in files.items():
        pg.set_content(page(sid,warm));pg.pdf(path=f"{root}/print/{fn}",format='A4',landscape=True,print_background=True,prefer_css_page_size=True)
        print(fn)
    b.close()
