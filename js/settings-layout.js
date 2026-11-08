/* Mein Training: ordered settings panels, additive and storage-compatible. */
(function(){
 S.ui=S.ui||{};
 const titles=[
  'Darstellung & Sprache','Home Reihung und Anzeige konfigurieren','Verlauf Reihung und Anzeige konfigurieren','FAQ','Make me feel it','Lokale Benachrichtigungen','Kalender Erinnerungen','Pläne sichern','Verlauf sichern','Gewicht eingeben – für BMI Berechnung','Training','Native Android Widget','Datenschutz & Impressum'
 ];
 const escAttr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 const savedOpen=key=>S.ui.settingsExpanded?.[key]===true;
 window.mtSettingsOpen=function(key,open){S.ui.settingsExpanded=S.ui.settingsExpanded||{};S.ui.settingsExpanded[key]=open;save();};
 function card(title,content,collapsed=false,key=''){
  if(!collapsed)return `<section class="c"><h3>${title}</h3>${content}</section>`;
  return `<section class="c"><details ${savedOpen(key)?'open':''} ontoggle="mtSettingsOpen('${key}',this.open)"><summary style="cursor:pointer;font-weight:700;font-size:1.05em">${title}</summary><div style="margin-top:12px">${content}</div></details></section>`;
 }
 function extract(html){const t=document.createElement('template');t.innerHTML=html;return [...t.content.children].filter(e=>e.classList?.contains('c'));}
 function content(node){const clone=node.cloneNode(true);const h=clone.querySelector(':scope > h3');if(h)h.remove();return clone.innerHTML;}
 const sectionName=n=>(n.querySelector(':scope > h3')?.textContent||'').trim().toLowerCase();
 const orig=vSet;
 vSet=function(){
  const cards=extract(orig());
  const taken=new Set();
  const take=(re)=>{const n=cards.find(x=>!taken.has(x)&&re.test(sectionName(x)));if(n)taken.add(n);return n};
  const appearance=take(/darstellung|appearance/);
  // Extract embedded legacy ordering controls from Appearance, rather than duplicating them.
  let embeddedHome='';let embeddedHistory='';
  if(appearance){
   const matches=[...appearance.querySelectorAll('details,section,.c')];
   for(const n of matches){
    const label=(n.querySelector(':scope > summary,:scope > h3,:scope > h4')?.textContent||'').toLowerCase();
    if(/home.*(reihung|konfigurieren|anzeige)/.test(label)){embeddedHome=n.innerHTML;n.remove();}
    else if(/verlauf.*(reihung|konfigurieren|anzeige)/.test(label)){embeddedHistory=n.innerHTML;n.remove();}
   }
  }

  const home=take(/home.*(konfigurieren|reihung)|configure home/);
  const faq=take(/^faq$/);
  const finance=take(/make me feel it/);
  const notifications=take(/lokale benachrichtigungen|local notifications/);
  const calendar=take(/kalender.erinnerung|calendar reminder/);
  const plans=take(/pläne sichern|plans backup|backup plans/);
  const history=take(/verlauf sichern|history backup|backup history/);
  const training=take(/^training$|^workout$/);
  const widgets=take(/native android widgets?/);
  const privacy=take(/datenschutz|privacy/);
  const extras=cards.filter(x=>!taken.has(x) && !/home.*(konfigurieren|reihung)|verlauf.*(reihung|konfigurieren)/.test(sectionName(x)));
  const weight=cards.find(x=>!taken.has(x)&&/gewicht|weight|bmi/.test(sectionName(x)));
  if(weight)taken.add(weight);
  // Do not repeat any legacy Home/History configuration cards.
  const labels={plans:'Trainingspläne',activities:'Aktivitäten',favorites:'Favoriten',pause:'Pausen',quote:'Motivationsspruch',weight:'Gewicht',bpm:'BPM',breath:'Atemübungen',challenge:'Challenge',streak:'Streaks',finance:'Make me feel it'};
  const order=S.homeOrder||[];
  const homeContent=home?content(home):(embeddedHome||order.map((k,i)=>`<div class="settingsRow"><label style="flex:1"><input type="checkbox" ${S.homeVisible?.[k]===false?'':'checked'} onchange="S.homeVisible['${k}']=this.checked;save();render()"> ${labels[k]||escAttr(k)}</label><button class="chip" onclick="moveHome(${i},-1)">↑</button><button class="chip" onclick="moveHome(${i},1)">↓</button></div>`).join(''));
  const histLabels={statsPlanned:'Geplante Aktivitäten',statsAll:'Alle Aktivitäten und Übungen',chart:'Trainingsentwicklung',weight:'Gewicht',activities:'Aktivitäten',challenge:'Challenge',milestones:'Erfolge',finance:'Make me feel it',exercises:'Einzelübungen',plans:'Trainingspläne',other:'Weitere Bereiche'};
  S.ui.historyOrder=Array.isArray(S.ui.historyOrder)?[...new Set([...S.ui.historyOrder,...Object.keys(histLabels)])]:Object.keys(histLabels);
  const visible=S.ui.historyVisible||{};
  const histContent=embeddedHistory||S.ui.historyOrder.map((k,i)=>`<div class="settingsRow"><label style="flex:1"><input type="checkbox" ${visible[k]===false?'':'checked'} onchange="mtHistoryVisible('${k}',this.checked)"> ${histLabels[k]||escAttr(k)}</label><button class="chip" onclick="mtHistoryMove(${i},-1)">↑</button><button class="chip" onclick="mtHistoryMove(${i},1)">↓</button></div>`).join('');
  // Strip duplicate legacy controls from the Appearance card (including nested headings).
  if(appearance){
   for(const node of [...appearance.querySelectorAll('h3,h4,summary')]){
    if(/home.*(reihung|konfigurieren|anzeige)|verlauf.*(reihung|konfigurieren|anzeige)/i.test(node.textContent||'')){
     const parent=node.closest('details,.settingsRow')||node.parentElement;
     if(parent&&parent!==appearance)parent.remove();
    }
   }
  }
  const blocks=[
   appearance?appearance.outerHTML:'',
   card(titles[1],homeContent,true,'home'),
   card(titles[2],histContent,true,'history'),
   card(titles[3],faq?content(faq):v27FAQ(),true,'faq'),
   card(titles[4],finance?content(finance):'',true,'finance'),
   notifications?notifications.outerHTML:'',
   calendar?calendar.outerHTML:'',
   plans?plans.outerHTML:'',
   history?history.outerHTML:'',
   weight?card('Gewicht eingeben – für BMI Berechnung',content(weight)):card('Gewicht eingeben – für BMI Berechnung',''),
   training?training.outerHTML:'',
   widgets?widgets.outerHTML:'',
   privacy?privacy.outerHTML:''
  ];
  // Retain every additional setting that is not part of the requested 12 panels.
  if(extras.length){const target=blocks.findIndex(Boolean);if(target>=0){const t=document.createElement('template');t.innerHTML=blocks[target];const section=t.content.firstElementChild;extras.forEach(x=>section.appendChild(x.cloneNode(true)));blocks[target]=section.outerHTML;}}
  return `<h2>${typeof v27Text==='function'?v27Text('settings'):'Einstellungen'}</h2>`+blocks.join('');
 };
 window.mtHistoryVisible=function(k,on){S.ui.historyVisible=S.ui.historyVisible||{};S.ui.historyVisible[k]=on;save();};
 window.mtHistoryMove=function(i,delta){const a=S.ui.historyOrder,j=i+delta;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();render();};
 const oldHist=vHist;
 vHist=function(){const html=oldHist();const tpl=document.createElement('template');tpl.innerHTML=html;
  const sections=[...tpl.content.children];const groups={};const labels={statsPlanned:/geplante aktivitäten/i,statsAll:/alle aktivitäten und übungen/i,chart:/trainingsentwicklung/i,weight:/gewicht/i,activities:/aktivitäten.*historie|aktivitäten.*zeitstempel/i,challenge:/challenge/i,milestones:/meilenstein|erfolge/i,finance:/make me feel it/i,exercises:/einzelübungen/i,plans:/trainingspläne/i};
  for(const n of sections){const text=(n.querySelector?.('h3,h2')?.textContent||n.textContent||'').trim();const k=Object.keys(labels).find(k=>labels[k].test(text))||'other';(groups[k]||(groups[k]=[])).push(n.outerHTML)}
  const order=S.ui.historyOrder||Object.keys(labels).concat('other');return order.filter(k=>S.ui.historyVisible?.[k]!==false).map(k=>(groups[k]||[]).join('')).join('')+Object.keys(groups).filter(k=>!order.includes(k)).map(k=>groups[k].join('')).join('');
 };
})();
