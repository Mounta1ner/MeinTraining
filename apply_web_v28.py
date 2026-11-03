#!/usr/bin/env python3
"""Apply Mein Training v2.8 web/iOS fixes to an extracted GitHub project."""
from pathlib import Path
import sys, json, re

root = Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
www=root/'www'
if not (www/'index.html').is_file() or not (www/'js/tracking-advanced.js').is_file():
    sys.exit('FEHLER: Bitte im entpackten Mein-Training-GitHub-Projekt ausfuehren (www/index.html und www/js/tracking-advanced.js fehlen).')

def write(path,content):
    path.parent.mkdir(parents=True,exist_ok=True)
    if not path.exists() or path.read_text(encoding='utf-8') != content:
        path.write_text(content,encoding='utf-8')
        print('Aktualisiert:',path.relative_to(root))

def replace_once(text,old,new,desc):
    if old in text:return text.replace(old,new)
    if new in text:return text
    sys.exit('FEHLER: Erwartete Stelle nicht gefunden: '+desc)

# 1. Both visible and copied IBAN must match.
p=www/'js/tracking-advanced.js'
s=p.read_text(encoding='utf-8')
old='AT55 19121234567890';old_plain='AT5519121234567890'
if old not in s and old_plain not in s and 'AT55 1912080529408009' not in s:
    sys.exit('FEHLER: Spendendaten im vorhandenen tracking-advanced.js nicht gefunden.')
s=s.replace(old,'AT55 1912080529408009').replace(old_plain,'AT551912080529408009')
write(p,s)

# 2/3. iOS standalone mode and safe-area; do not override existing theme/layout.
p=www/'index.html';s=p.read_text(encoding='utf-8')
insert='''<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Mein Training">
<meta name="theme-color" content="#0f766e">
<link rel="apple-touch-icon" sizes="180x180" href="./assets/apple-touch-icon.png">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="stylesheet" href="./css/ios-v28.css">
'''
for line in insert.splitlines():
    if line not in s:
        s=s.replace('</head>',line+'\n</head>')
if 'viewport' in s:
    s=re.sub(r'(<meta\s+name=["\']viewport["\']\s+content=["\'])([^"\']*)(["\'])',lambda m:m.group(1)+(m.group(2) if 'viewport-fit=cover' in m.group(2) else m.group(2)+', viewport-fit=cover')+m.group(3),s,count=1)
else:
    s=s.replace('</head>','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>')
write(p,s)

write(www/'css/ios-v28.css', '''/* iOS safe areas; preserve existing layout and color scheme. */
@supports (padding: env(safe-area-inset-top)) {
  body { padding-top: max(0px, env(safe-area-inset-top));
         padding-bottom: max(0px, env(safe-area-inset-bottom)); }
  #nav, nav { padding-bottom: max(0px, env(safe-area-inset-bottom)); }
}
html { -webkit-text-size-adjust: 100%; }
button, input, select, textarea { touch-action: manipulation; }
input, select, textarea { font-size: max(16px, 1em); }
''')
manifest=www/'manifest.webmanifest'
if manifest.exists():
    try: data=json.loads(manifest.read_text(encoding='utf-8'))
    except json.JSONDecodeError:sys.exit('FEHLER: manifest.webmanifest ist kein gueltiges JSON')
else:data={}
data.update({'name':'Mein Training','short_name':'Mein Training','display':'standalone','start_url':'./','scope':'./','background_color':'#0f766e','theme_color':'#0f766e'})
if not data.get('icons'):data['icons']=[{'src':'./assets/icon-192.png','sizes':'192x192','type':'image/png'},{'src':'./assets/icon-512.png','sizes':'512x512','type':'image/png'}]
write(manifest,json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# 4. Version check uses network-first, does NOT cache user data and does NOT register a service worker.
# It is intentionally opt-in: existing service worker must be inspected before modifying its caching strategy.
write(www/'version.json',json.dumps({'version':'2.8.1','webPatch':'ios-and-iban','storageKey':'trainingsplan-v1'},indent=2)+'\n')
write(www/'js/web-version-v28.js','''/* Non-destructive update check. Does not alter localStorage or caches. */
(function(){
  let previous='';
  async function check(){
    try{
      const response=await fetch('./version.json?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      if(!data.version)return;
      const key='mein-training-last-seen-web-version';
      previous=sessionStorage.getItem(key)||'';
      if(previous&&previous!==data.version){
        let banner=document.getElementById('v28UpdateBanner');
        if(!banner){
          banner=document.createElement('div');banner.id='v28UpdateBanner';
          banner.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(75px + env(safe-area-inset-bottom));z-index:99999;background:#123f3b;color:#fff;padding:12px;border-radius:12px;box-shadow:0 3px 15px #0005;';
          banner.innerHTML='<span>Neue Web-Version verfügbar.</span> <button type="button" id="v28UpdateNow" style="padding:8px;margin-left:8px">Neu laden</button>';
          document.body.appendChild(banner);
          document.getElementById('v28UpdateNow').onclick=()=>{sessionStorage.setItem(key,data.version);location.reload();};
        }
      } else if(!previous)sessionStorage.setItem(key,data.version);
    }catch(err){console.debug('Versionsprüfung nicht verfügbar',err)}
  }
  window.addEventListener('load',()=>{check();document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()})});
})();
''')
p=www/'index.html';s=p.read_text(encoding='utf-8');script='<script defer src="./js/web-version-v28.js"></script>'
if script not in s:s=s.replace('</body>',script+'\n</body>')
write(p,s)
# Do not replace an existing service worker, to avoid breaking offline functionality.
print('FERTIG: IBAN, iOS, Manifest und nicht-destruktive Versionspruefung aktualisiert.')
print('HINWEIS: Existierenden Service Worker und iPhone-Installation weiterhin manuell testen.')
