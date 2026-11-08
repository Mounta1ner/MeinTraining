/* Offline-first catalog loader for GitHub Pages and Capacitor. */
(async function(){
 const paths=['exercises','plans','translations'];
 const modules=['app','features','tracking-advanced','v27','v28','v282'];
 try{
  const data=await Promise.all(paths.map(async key=>{
   const response=await fetch('./data/'+key+'.json',{cache:'no-cache'});
   if(!response.ok)throw Error(key+' HTTP '+response.status);
   return response.json();
  }));
  if(!Array.isArray(data[0])||!Array.isArray(data[1].templates)||!Array.isArray(data[1].curated)||!data[2]?.de)throw Error('Ungueltig strukturierte Daten');
  window.FITNESS_CATALOG={exercises:data[0],plans:data[1],translations:data[2]};
  for(const file of modules){
   await new Promise((resolve,reject)=>{
    const element=document.createElement('script');
    element.src='./js/'+file+'.js';
    element.onload=resolve;
    element.onerror=()=>reject(Error(file+' konnte nicht geladen werden'));
    document.body.appendChild(element);
   });
  }
 }catch(error){
  console.error(error);
  document.getElementById('app').innerHTML='<section class="c"><h2>App konnte nicht starten</h2><p>Die Trainingsdaten konnten nicht geladen werden. Oeffne die Web-App ueber GitHub Pages oder einen Webserver, nicht direkt als Datei.</p><p class="mu"></p></section>';
  document.querySelector('#app .mu').textContent=error.message;
 }
})();
