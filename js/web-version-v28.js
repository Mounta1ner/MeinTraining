/* Non-destructive update check. Does not alter localStorage or caches. */
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
