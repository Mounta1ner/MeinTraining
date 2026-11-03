package at.meintraining.fitness;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Locale;
public class FitnessWidgets extends AppWidgetProvider {
 static final Object LOCK=new Object();static final String TAP="at.meintraining.fitness.WIDGET_TAP";
 @Override public void onReceive(Context c, Intent intent){if(TAP.equals(intent.getAction())){
  String command=intent.getStringExtra("command");int widgetId=intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,-1);SharedPreferences p=c.getSharedPreferences("widgets",Context.MODE_PRIVATE);
  if("complete".equals(command)){synchronized(LOCK){String hid=p.getString("instance_"+widgetId,"");if(!hid.isEmpty())try{
   JSONArray a=new JSONArray(p.getString("events","[]"));JSONObject e=new JSONObject();e.put("id",hid);e.put("timestamp",System.currentTimeMillis());e.put("date",new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date()));a.put(e);p.edit().putString("events",a.toString()).commit();
  }catch(Exception ignored){} }android.widget.Toast.makeText(c,"Aktivität erfasst",android.widget.Toast.LENGTH_SHORT).show();updateAll(c);return;}
  if("start".equals(command)){Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());if(launch!=null){launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);c.startActivity(launch);}return;}
 }super.onReceive(c,intent);}
 @Override public void onUpdate(Context c,AppWidgetManager a,int[] ids){updateAll(c);}
 @Override public void onDeleted(Context c,int[] ids){SharedPreferences.Editor e=c.getSharedPreferences("widgets",Context.MODE_PRIVATE).edit();for(int id:ids)e.remove("instance_"+id);e.apply();}
 static void updateAll(Context c){AppWidgetManager a=AppWidgetManager.getInstance(c);refresh(c,a,SmallWidget.class,R.layout.widget_small,"complete");refresh(c,a,LargeWidget.class,R.layout.widget_large,"start");}
 static void refresh(Context c,AppWidgetManager mgr,Class<?> provider,int layout,String cmd){SharedPreferences p=c.getSharedPreferences("widgets",Context.MODE_PRIVATE);for(int id:mgr.getAppWidgetIds(new ComponentName(c,provider))){ RemoteViews v=new RemoteViews(c.getPackageName(),layout);
 String name="Aktivität",plan=p.getString("plan","Training"),next=p.getString("next","Öffnen"),hid=p.getString("instance_"+id,"");
 try{JSONArray arr=new JSONArray(p.getString("habits","[]"));for(int i=0;i<arr.length();i++){JSONObject h=arr.getJSONObject(i);if(hid.equals(h.optString("id"))){name=h.optString("name","Aktivität");break;}}}catch(Exception ignored){}
 v.setTextViewText(R.id.widget_title,layout==R.layout.widget_small?name:plan);v.setTextViewText(R.id.widget_next,layout==R.layout.widget_small?"✓":next);
 String color=p.getString("palette","petrol");int accent="gold".equals(color)?Color.rgb(233,189,74):"orange".equals(color)?Color.rgb(255,153,70):Color.rgb(37,202,185);
 v.setTextColor(R.id.widget_title,accent);v.setTextColor(R.id.widget_next,accent);
 Intent intent=new Intent(c,provider);intent.setAction(TAP);intent.putExtra("command",cmd);intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,id);
 PendingIntent click=PendingIntent.getBroadcast(c,id+(layout==R.layout.widget_small?100000:200000),intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);v.setOnClickPendingIntent(R.id.widget_box,click);mgr.updateAppWidget(id,v);
 }}
 public static class SmallWidget extends FitnessWidgets{}public static class LargeWidget extends FitnessWidgets{}
}
