from pathlib import Path
import shutil
root=Path('native_overrides/app/src/main');dst=Path('android/app/src/main')
for f in root.rglob('*'):
 if f.is_file():
  target=dst/f.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
adaptive=dst/'res/mipmap-anydpi-v26'
if adaptive.exists():
 for name in ['ic_launcher.xml','ic_launcher_round.xml']:
  file=adaptive/name
  if file.exists():file.unlink()
p=dst/'AndroidManifest.xml';s=p.read_text();marker='FitnessWidgets$SmallWidget'
if marker not in s:s=s.replace('</application>',Path('native_overrides/receivers.xml').read_text()+'</application>')
p.write_text(s)
print('Native implementation installed')

# Dynamically switch launcher icon via three aliases to the same MainActivity.
import xml.etree.ElementTree as ET
ns='http://schemas.android.com/apk/res/android';ET.register_namespace('android',ns)
manifest=ET.parse(p);root=manifest.getroot();app=root.find('application')
main=next((a for a in app.findall('activity') if a.get('{'+ns+'}name') in ('.MainActivity','at.meintraining.fitness.MainActivity')),None)
if main is None:raise RuntimeError('Capacitor MainActivity missing')
# Move only the MAIN/LAUNCHER filter from the original activity to the aliases.
for intent in list(main.findall('intent-filter')):
 actions=[a.get('{'+ns+'}name') for a in intent.findall('action')]
 categories=[a.get('{'+ns+'}name') for a in intent.findall('category')]
 if 'android.intent.action.MAIN' in actions and 'android.intent.category.LAUNCHER' in categories:main.remove(intent)
for theme in ('petrol','gold','orange'):
 alias=ET.SubElement(app,'activity-alias',{'{'+ns+'}name':'.Launcher'+theme.capitalize(),'{'+ns+'}targetActivity':'.MainActivity','{'+ns+'}icon':'@mipmap/ic_launcher_'+theme,'{'+ns+'}exported':'true','{'+ns+'}enabled':'true' if theme=='petrol' else 'false'})
 filt=ET.SubElement(alias,'intent-filter');ET.SubElement(filt,'action',{'{'+ns+'}name':'android.intent.action.MAIN'});ET.SubElement(filt,'category',{'{'+ns+'}name':'android.intent.category.LAUNCHER'})
ET.indent(root,space='    ');ET.ElementTree(root).write(p,encoding='unicode',xml_declaration=True)
print('Launcher icon aliases installed')
