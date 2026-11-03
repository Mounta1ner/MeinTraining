package at.meintraining.fitness;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.content.SharedPreferences;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state){super.onCreate(state);getBridge().getWebView().addJavascriptInterface(new WidgetBridge(),"AndroidBridge");}
 private void switchLauncherIcon(String requested){
  String theme=(requested.equals("gold")||requested.equals("orange"))?requested:"petrol";
  PackageManager pm=getPackageManager();String pkg=getPackageName();
  String[] names={"LauncherPetrol","LauncherGold","LauncherOrange"};
  String target="Launcher"+theme.substring(0,1).toUpperCase()+theme.substring(1);
  try{
   // Enable target before disabling others, so a launcher entry always exists.
   ComponentName active=new ComponentName(this,pkg+"."+target);
   pm.setComponentEnabledSetting(active,PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);
   for(String name:names)if(!name.equals(target))pm.setComponentEnabledSetting(new ComponentName(this,pkg+"."+name),PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP);
  }catch(Exception ex){android.util.Log.e("MeinTraining","Launcher icon switch failed",ex);}
 }
 public class WidgetBridge {
  @JavascriptInterface public void sync(String data){try{JSONObject o=new JSONObject(data);SharedPreferences.Editor e=getSharedPreferences("widgets",MODE_PRIVATE).edit();
   if(o.has("snapshot")){JSONObject snap=new JSONObject(o.optString("snapshot","{}"));e.putString("habits",snap.optJSONArray("habits")==null?"[]":snap.optJSONArray("habits").toString());}
   if(o.has("habits"))e.putString("habits",o.optJSONArray("habits").toString());
   e.putString("plan",o.optString("plan",getSharedPreferences("widgets",MODE_PRIVATE).getString("plan","Training")));e.putString("next",o.optString("next",getSharedPreferences("widgets",MODE_PRIVATE).getString("next","Öffnen")));
   if(o.has("palette")){String theme=o.optString("palette","petrol");e.putString("palette",theme);MainActivity.this.runOnUiThread(()->switchLauncherIcon(theme));}e.apply();FitnessWidgets.updateAll(MainActivity.this);
  }catch(Exception ignored){}}
  @JavascriptInterface public String consumeAction(){SharedPreferences p=getSharedPreferences("widgets",MODE_PRIVATE);String cmd=p.getString("action","");p.edit().remove("action").apply();return cmd;}
  @JavascriptInterface public String drainEvents(){synchronized(FitnessWidgets.LOCK){SharedPreferences p=getSharedPreferences("widgets",MODE_PRIVATE);String events=p.getString("events","[]");p.edit().putString("events","[]").commit();return events;}}
 }
 @Override public void onResume(){super.onResume();if(getBridge()!=null)getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new Event('focus'))",null);}
}
