package at.meintraining.fitness;
import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.os.Bundle;
import android.content.Intent;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
public class WidgetConfigActivity extends Activity {
 @Override public void onCreate(Bundle state){super.onCreate(state);int wid=getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,AppWidgetManager.INVALID_APPWIDGET_ID);
 Intent result=new Intent();result.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,wid);setResult(RESULT_CANCELED,result);if(wid==AppWidgetManager.INVALID_APPWIDGET_ID){finish();return;}
 LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(25,65,25,35);root.setBackgroundColor(0xff0e2826);
 TextView caption=new TextView(this);caption.setText("Aktivität diesem Widget zuordnen");caption.setTextColor(-1);caption.setTextSize(20);root.addView(caption);
 ArrayList<String> names=new ArrayList<>(),ids=new ArrayList<>();try{JSONArray h=new JSONArray(getSharedPreferences("widgets",MODE_PRIVATE).getString("habits","[]"));for(int i=0;i<h.length();i++){JSONObject a=h.getJSONObject(i);names.add(a.optString("name","Aktivität"));ids.add(a.optString("id"));}}catch(Exception ignored){}
 if(ids.isEmpty()){TextView empty=new TextView(this);empty.setText("Öffne die App, lege erst eine Aktivität an und füge dieses Widget erneut hinzu.");empty.setTextColor(-1);root.addView(empty);setContentView(root);return;}
 Spinner choose=new Spinner(this);choose.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,names));choose.setBackgroundColor(0xfff3faf9);choose.setPopupBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0xffffffff));root.addView(choose);
 String previous=getSharedPreferences("widgets",MODE_PRIVATE).getString("instance_"+wid,"");if(ids.contains(previous))choose.setSelection(ids.indexOf(previous));
 Button done=new Button(this);done.setText("Widget speichern");root.addView(done);done.setOnClickListener(v->{getSharedPreferences("widgets",MODE_PRIVATE).edit().putString("instance_"+wid,ids.get(choose.getSelectedItemPosition())).commit();FitnessWidgets.updateAll(this);Toast.makeText(this,"Widget gespeichert",Toast.LENGTH_SHORT).show();setResult(RESULT_OK,result);finish();});setContentView(root);
 }
}
