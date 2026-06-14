import { useState, useEffect } from "react";

const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const DEFAULT_HABITS = [
  { id:"hipopresivos", name:"Hipopresivos",        emoji:"🧘", color:"#00C9A7", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"En ayunas al levantarte"        },
  { id:"gimnasio",     name:"Gimnasio",             emoji:"🏋️", color:"#00B4D8", twice:false, skipDays:[0],           type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Lunes a sábado"                 },
  { id:"minoxidil",    name:"Minoxidil",            emoji:"💧", color:"#48CAE4", twice:true,  skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Mañana y noche"                 },
  { id:"dientes",      name:"Lavado de dientes",    emoji:"🦷", color:"#90E0EF", twice:true,  skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Mañana y noche"                 },
  { id:"bicarbonato",  name:"Bicarbonato",          emoji:"✨", color:"#00C9A7", twice:false, skipDays:[0,1,2,3,4,6], type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Solo los viernes"               },
  { id:"alcohol",      name:"Alcohol",              emoji:"🍺", color:"#EF476F", twice:false, skipDays:[],            type:"limit", maxPerWeek:2,    weeklyTarget:null, note:"Máximo 2 días por semana"       },
  { id:"barra",        name:"Colgarse en barra",    emoji:"🏗️", color:"#00B4D8", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"10 min · descompresión columna" },
  { id:"huevos",       name:"8 Huevos",             emoji:"🥚", color:"#FFB703", twice:true,  skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"4 a la mañana · 4 a la noche"  },
  { id:"remolacha",    name:"Remolacha en polvo",   emoji:"🫐", color:"#C77DFF", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"10g · antes del entreno"        },
  { id:"sueno",        name:"7hs30 de sueño",       emoji:"😴", color:"#7B9EE8", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Marcar al levantarte"           },
  { id:"agua",         name:"Agua",                 emoji:"🥤", color:"#48CAE4", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"3 litros diarios"               },
  { id:"camasolar",    name:"Cama solar",           emoji:"☀️", color:"#FFB703", twice:false, skipDays:[0,1,2,3,4,6], type:"goal",  maxPerWeek:null, weeklyTarget:null, note:"Solo los viernes"               },
  { id:"bici",         name:"Bicicleta estática",   emoji:"🚴", color:"#06D6A0", twice:false, skipDays:[],            type:"goal",  maxPerWeek:null, weeklyTarget:3,    note:"3 veces por semana · vos elegís los días" },
];

// ── Liquid Glass palette ───────────────────────────────────
const G = {
  bg:          "#060A0D",
  card:        "rgba(14, 24, 34, 0.72)",
  cardBorder:  "rgba(255,255,255,0.08)",
  cardShadow:  "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
  surface:     "rgba(10, 18, 26, 0.85)",
  teal:        "#00C9A7",
  tealDim:     "rgba(0,201,167,0.15)",
  tealBorder:  "rgba(0,201,167,0.28)",
  tealGlow:    "rgba(0,201,167,0.18)",
  text:        "#EEF4F8",
  sub:         "#4A7080",
  dim:         "#1C3040",
  danger:      "#EF476F",
  gold:        "#FFB703",
  blur:        "blur(24px)",
};

function cardStyle(lit, color){
  if(!lit) return { background:G.card, backdropFilter:G.blur, WebkitBackdropFilter:G.blur, border:`1px solid ${G.cardBorder}`, boxShadow:G.cardShadow };
  const c = color||G.teal;
  return { background:`rgba(0,201,167,0.07)`, backdropFilter:G.blur, WebkitBackdropFilter:G.blur, border:`1px solid ${c}44`, boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 28px ${c}22, inset 0 1px 0 ${c}20` };
}

// ── Helpers ──────────────────────────────────────────────
function toDateStr(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function getLast7(){ return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; }); }
function weekOf(dateStr){ const d=new Date(dateStr+"T00:00:00"); d.setDate(d.getDate()-d.getDay()); return toDateStr(d); }
function isApplicable(h,date){ return !h.skipDays.includes(date.getDay()); }
function limitWeekCount(hid,ws,logs){ return Object.keys(logs).filter(k=>{ const [a,b]=k.split("|"); return a===hid&&b&&weekOf(b)===ws&&logs[k]; }).length; }
function weeklyGoalCount(hid,ws,logs){ return Object.keys(logs).filter(k=>{ const p=k.split("|"); return p[0]===hid&&p[1]&&p.length===2&&weekOf(p[1])===ws&&logs[k]; }).length; }
function isDone(hid,ds,logs){ return !!logs[`${hid}|${ds}`]; }
function isTwiceDone(hid,ds,s,logs){ return !!logs[`${hid}|${ds}|${s}`]; }

function goalStreak(hid,logs){
  let s=0; const t=new Date();
  for(let i=0;i<=120;i++){
    const d=new Date(t); d.setDate(d.getDate()-i); const ds=toDateStr(d);
    const h=DEFAULT_HABITS.find(x=>x.id===hid); if(!h) break;
    if(!isApplicable(h,d)) continue;
    if(h.twice){ if(logs[`${hid}|${ds}|m`]&&logs[`${hid}|${ds}|n`]) s++; else if(i>0) break; }
    else{ if(logs[`${hid}|${ds}`]) s++; else if(i>0) break; }
  }
  return s;
}
function perfectStreak(habits,logs){
  const t=new Date(); let s=0;
  for(let i=0;i<=365;i++){
    const d=new Date(t); d.setDate(d.getDate()-i); const ds=toDateStr(d);
    const ap=habits.filter(h=>h.type==="goal"&&isApplicable(h,d));
    if(!ap.length) continue;
    const ok=ap.every(h=>{ if(h.twice) return !!(logs[`${h.id}|${ds}|m`]&&logs[`${h.id}|${ds}|n`]); if(h.weeklyTarget) return weeklyGoalCount(h.id,weekOf(ds),logs)>=h.weeklyTarget||!!logs[`${h.id}|${ds}`]; return !!logs[`${h.id}|${ds}`]; });
    if(ok) s++; else if(i>0) break;
  }
  return s;
}
function getDayPct(date,habits,logs){
  const ds=toDateStr(date);
  const ap=habits.filter(h=>h.type==="goal"&&isApplicable(h,date));
  if(!ap.length) return null;
  const tot=ap.reduce((a,h)=>a+(h.twice?2:1),0);
  const done=ap.reduce((a,h)=>{ if(h.twice) return a+(logs[`${h.id}|${ds}|m`]?1:0)+(logs[`${h.id}|${ds}|n`]?1:0); if(h.weeklyTarget) return a+(weeklyGoalCount(h.id,weekOf(ds),logs)>=h.weeklyTarget||!!logs[`${h.id}|${ds}`]?1:0); return a+(logs[`${h.id}|${ds}`]?1:0); },0);
  return tot>0?done/tot:0;
}

// ── .ics generator with time + alarm ─────────────────────
function buildICS(task, flashFn){
  const ds=task.date.replace(/-/g,"");
  const now=new Date().toISOString().replace(/[-:.]/g,"").slice(0,15)+"Z";
  let dtS, dtE;
  if(task.startTime){
    const [sh,sm]=task.startTime.split(":").map(Number);
    dtS=`${ds}T${String(sh).padStart(2,"0")}${String(sm).padStart(2,"0")}00`;
    if(task.endTime){ const [eh,em]=task.endTime.split(":").map(Number); dtE=`${ds}T${String(eh).padStart(2,"0")}${String(em).padStart(2,"0")}00`; }
    else{ dtE=`${ds}T${String(sh+1).padStart(2,"0")}${String(sm).padStart(2,"0")}00`; }
  }
  const allDay=!task.startTime;
  const lines=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Habitos//ES",
    "BEGIN:VEVENT",
    `UID:${task.id}@habitos`,`DTSTAMP:${now}`,
    allDay?`DTSTART;VALUE=DATE:${ds}`:`DTSTART;TZID=America/Argentina/Buenos_Aires:${dtS}`,
    allDay?`DTEND;VALUE=DATE:${ds}`:`DTEND;TZID=America/Argentina/Buenos_Aires:${dtE}`,
    `SUMMARY:${task.title}`,
    task.note?`DESCRIPTION:${task.note}`:"",
    task.reminderMin>0?["BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:Recordatorio: ${task.title}`,`TRIGGER:-PT${task.reminderMin}M`,"END:VALARM"].join("\r\n"):"",
    "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
  try {
    const blob=new Blob([lines],{type:"text/calendar;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="evento.ics"; a.style.display="none";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },1000);
    if(flashFn) flashFn("📅 Abrí el archivo para agregar al calendario");
  } catch(e){
    const uri="data:text/calendar;charset=utf8,"+encodeURIComponent(lines);
    window.open(uri,"_blank");
  }
}

// ── Shared form styles ────────────────────────────────────
const IS = { background:"rgba(4,8,12,0.8)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 16px", color:"#EEF4F8", fontSize:14, boxSizing:"border-box", outline:"none", width:"100%", boxShadow:"inset 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" };
const COLORS = ["#00C9A7","#00B4D8","#48CAE4","#FFB703","#EF476F","#C77DFF","#06D6A0","#90E0EF","#F472B6","#FB923C"];
const DAYS_SHORT_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ── Habit form (shared by Add + Edit) ────────────────────
function HabitForm({ initial, onSave, onCancel, title }){
  const [h, setH] = useState(initial);
  const set = (k,v) => setH(p=>({...p,[k]:v}));
  const toggleSkip = (d) => set("skipDays", h.skipDays.includes(d) ? h.skipDays.filter(x=>x!==d) : [...h.skipDays,d]);

  return(
    <div style={{background:"rgba(8,14,20,0.94)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"22px 18px 18px",marginTop:10,boxShadow:"0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)"}}>
      <div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:2,margin:"0 auto 18px"}}/>
      <div style={{fontWeight:800,fontSize:11,color:G.teal,letterSpacing:3,textTransform:"uppercase",marginBottom:20,textAlign:"center"}}>{title}</div>

      <Row label="EMOJI"><input value={h.emoji} onChange={e=>set("emoji",e.target.value)} style={{...IS,width:60,fontSize:22,textAlign:"center",padding:"8px"}}/></Row>
      <Row label="NOMBRE"><input placeholder="Ej: Meditar, Leer..." value={h.name} onChange={e=>set("name",e.target.value)} style={IS}/></Row>
      <Row label="NOTA"><input placeholder="Descripción corta" value={h.note} onChange={e=>set("note",e.target.value)} style={IS}/></Row>

      <Row label="TIPO">
        <div style={{display:"flex",gap:8}}>
          {[["goal","✓ Meta"],["limit","✕ Límite"]].map(([v,l])=>(
            <button key={v} onClick={()=>set("type",v)} style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",border:`1px solid ${h.type===v?(v==="goal"?G.teal:G.danger):"rgba(255,255,255,0.1)"}`,background:h.type===v?(v==="goal"?"rgba(0,201,167,0.1)":"rgba(239,71,111,0.1)"):"transparent",color:h.type===v?(v==="goal"?G.teal:G.danger):G.sub,fontSize:13,fontWeight:600}}>{l}</button>
          ))}
        </div>
      </Row>

      {h.type==="goal"&&(
        <Row label="FRECUENCIA">
          <div style={{display:"flex",gap:6}}>
            {[["Diario",null,false],["X días/sem","wt",false],["2×/día",null,true]].map(([l,k,tw],i)=>{
              const active = tw?h.twice:(!h.weeklyTarget&&!h.twice);
              const activeWt = k==="wt"&&h.weeklyTarget&&!h.twice;
              const isActive = tw?h.twice:k==="wt"?activeWt:active;
              return(
                <button key={i} onClick={()=>{ if(tw){set("twice",!h.twice);set("weeklyTarget",null);} else if(k==="wt"){set("weeklyTarget",h.weeklyTarget||3);set("twice",false);} else{set("weeklyTarget",null);set("twice",false);} }} style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",border:`1px solid ${isActive?G.tealBorder:"rgba(255,255,255,0.08)"}`,background:isActive?G.tealDim:"transparent",color:isActive?G.teal:G.sub,fontSize:12,fontWeight:isActive?700:400}}>{l}</button>
              );
            })}
          </div>
          {h.weeklyTarget&&!h.twice&&(
            <div style={{display:"flex",gap:6,marginTop:8}}>
              {[1,2,3,4,5,6,7].map(n=>(
                <button key={n} onClick={()=>set("weeklyTarget",n)} style={{flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",border:`1px solid ${h.weeklyTarget===n?G.tealBorder:"rgba(255,255,255,0.08)"}`,background:h.weeklyTarget===n?G.tealDim:"transparent",color:h.weeklyTarget===n?G.teal:G.sub,fontSize:13,fontWeight:700}}>{n}</button>
              ))}
            </div>
          )}
          {h.type==="limit"&&(
            <div style={{display:"flex",gap:6,marginTop:8}}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>set("maxPerWeek",n)} style={{flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",border:`1px solid ${h.maxPerWeek===n?"rgba(239,71,111,0.4)":"rgba(255,255,255,0.08)"}`,background:h.maxPerWeek===n?"rgba(239,71,111,0.1)":"transparent",color:h.maxPerWeek===n?G.danger:G.sub,fontSize:13,fontWeight:700}}>{n}</button>
              ))}
            </div>
          )}
        </Row>
      )}
      {h.type==="limit"&&(
        <Row label="MÁXIMO DÍAS/SEMANA">
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>set("maxPerWeek",n)} style={{flex:1,padding:"9px 0",borderRadius:8,cursor:"pointer",border:`1px solid ${h.maxPerWeek===n?"rgba(239,71,111,0.4)":"rgba(255,255,255,0.08)"}`,background:h.maxPerWeek===n?"rgba(239,71,111,0.1)":"transparent",color:h.maxPerWeek===n?G.danger:G.sub,fontSize:13,fontWeight:700}}>{n}</button>
            ))}
          </div>
        </Row>
      )}

      {!h.twice&&h.type==="goal"&&!h.weeklyTarget&&(
        <Row label="DÍAS ACTIVOS (destildá los que querés saltear)">
          <div style={{display:"flex",gap:6}}>
            {DAYS_SHORT_ES.map((d,i)=>{ const skipped=h.skipDays.includes(i); return(
              <button key={i} onClick={()=>toggleSkip(i)} style={{flex:1,padding:"7px 0",borderRadius:8,cursor:"pointer",border:`1px solid ${skipped?"rgba(255,255,255,0.06)":G.tealBorder}`,background:skipped?"transparent":G.tealDim,color:skipped?G.dim:G.teal,fontSize:10,fontWeight:700}}>{d}</button>
            );})}
          </div>
        </Row>
      )}

      <Row label="COLOR">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {COLORS.map(c=>(<button key={c} onClick={()=>set("color",c)} style={{width:36,height:36,borderRadius:"50%",background:c,cursor:"pointer",border:h.color===c?"3px solid white":"2px solid transparent",boxShadow:h.color===c?`0 0 16px ${c}88`:"none",transform:h.color===c?"scale(1.15)":"scale(1)",transition:"all .2s"}}/>))}
        </div>
      </Row>

      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={onCancel} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 0",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14,letterSpacing:0.3}}>Cancelar</button>
        <button onClick={()=>onSave(h)} style={{flex:2,background:`linear-gradient(135deg,${G.teal} 0%,#00B4D8 100%)`,border:"none",borderRadius:14,padding:"13px 0",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,boxShadow:`0 4px 20px rgba(0,201,167,0.4), inset 0 1px 0 rgba(255,255,255,0.25)`}}>Guardar</button>
      </div>
    </div>
  );
}

function Row({label,children,icon=""}){
  return(<div style={{marginBottom:16}}>
    <label style={{fontSize:9,color:"rgba(255,255,255,0.32)",display:"flex",alignItems:"center",gap:5,marginBottom:8,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600}}>
      {icon&&<span style={{fontSize:12}}>{icon}</span>}{label}
    </label>
    {children}
  </div>);
}

// ── Main App ─────────────────────────────────────────────
export default function App(){
  const [habits,setHabits]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("hab-list-v7")||"null")||DEFAULT_HABITS; }catch{ return DEFAULT_HABITS; }});
  const [logs,  setLogs  ]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("hab-logs-v3")||"{}"); }catch{ return {}; }});
  const [tasks, setTasks ]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("hab-tasks-v1")||"[]"); }catch{ return []; }});
  const [view,  setView  ]=useState("today");
  const [toast, setToast ]=useState(null);
  const [histView,setHistView]=useState("week");
  const [monthOff,setMonthOff]=useState(0);
  // Habit form state
  const [showAddHabit,setShowAddHabit]=useState(false);
  const [editHabitId, setEditHabitId]=useState(null);
  // Task form state
  const [showAddTask,setShowAddTask]=useState(false);
  const [newTask,setNewTask]=useState({title:"",date:"",startTime:"",endTime:"",reminderMin:0,note:""});
  const [showFAB,setShowFAB]=useState(false);

  const today=new Date(), todayStr=toDateStr(today), todayDow=today.getDay();
  const wkStart=weekOf(todayStr), days7=getLast7();
  const streak=perfectStreak(habits,logs);

  useEffect(()=>{ try{ localStorage.setItem("hab-logs-v3",JSON.stringify(logs)); }catch{} },[logs]);
  useEffect(()=>{ try{ localStorage.setItem("hab-list-v7",JSON.stringify(habits)); }catch{} },[habits]);
  useEffect(()=>{ try{ localStorage.setItem("hab-tasks-v1",JSON.stringify(tasks)); }catch{} },[tasks]);

  function flash(msg,ok=true){ setToast({msg,ok}); setTimeout(()=>setToast(null),2200); }
  function setLog(k,v){ setLogs(p=>({...p,[k]:v})); }

  // Habit CRUD
  const blankHabit = ()=>({ id:"h"+Date.now(), name:"", emoji:"⚡", color:G.teal, twice:false, skipDays:[], type:"goal", maxPerWeek:2, weeklyTarget:null, note:"" });
  function saveHabit(h){
    if(!h.name.trim()){ flash("Ponele un nombre",false); return; }
    if(editHabitId){ setHabits(p=>p.map(x=>x.id===editHabitId?{...x,...h}:x)); setEditHabitId(null); flash("Hábito actualizado ✓"); }
    else{ setHabits(p=>[...p,h]); setShowAddHabit(false); flash("Hábito agregado ✓"); }
  }
  function deleteHabit(id){ setHabits(p=>p.filter(x=>x.id!==id)); }

  // Toggles
  function toggleSingle(hid,ds){
    const h=habits.find(x=>x.id===hid); if(!h) return;
    const key=`${hid}|${ds}`; const next=!logs[key];
    if(h.type==="limit"&&next){ const cnt=limitWeekCount(hid,weekOf(ds),{...logs,[key]:true}); if(cnt>h.maxPerWeek){ flash(`⚠ Límite: máx ${h.maxPerWeek} días/sem`,false); return; } flash("Registrado ✓"); }
    else flash(next?"Completado ✓":"Desmarcado");
    setLog(key,next);
  }
  function toggleTwice(hid,ds,slot){ const key=`${hid}|${ds}|${slot}`; setLog(key,!logs[key]); flash(!logs[key]?(slot==="m"?"☀️ Mañana ✓":"🌙 Noche ✓"):"Desmarcado"); }

  // Tasks
  function openAddTask(){ setNewTask({title:"",date:todayStr,startTime:"",endTime:"",reminderMin:0,note:""}); setShowAddTask(true); }
  function addTask(){ if(!newTask.title.trim()) return; setTasks(p=>[...p,{id:"t"+Date.now(),...newTask,done:false}]); setShowAddTask(false); flash("Tarea agregada ✓"); }
  function toggleTask(id){ setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t)); }
  function deleteTask(id){ setTasks(p=>p.filter(t=>t.id!==id)); }

  function taskDateLabel(ds){
    if(ds===todayStr) return "Hoy";
    const tom=new Date(today); tom.setDate(tom.getDate()+1);
    if(ds===toDateStr(tom)) return "Mañana";
    const d=new Date(ds+"T00:00:00");
    return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
  }

  // Progress
  const apGoals=habits.filter(h=>h.type==="goal"&&isApplicable(h,today));
  const totSlots=apGoals.reduce((a,h)=>a+(h.twice?2:1),0);
  const doneSlots=apGoals.reduce((a,h)=>{
    if(h.twice) return a+(logs[`${h.id}|${todayStr}|m`]?1:0)+(logs[`${h.id}|${todayStr}|n`]?1:0);
    if(h.weeklyTarget){ const wkc=weeklyGoalCount(h.id,wkStart,logs); return a+((wkc>=h.weeklyTarget||logs[`${h.id}|${todayStr}`])?1:0); }
    return a+(logs[`${h.id}|${todayStr}`]?1:0);
  },0);
  const pct=totSlots>0?Math.round(doneSlots/totSlots*100):0;
  const todaySkipped=habits.filter(h=>!isApplicable(h,today));
  const streakLabel=streak>=30?"🏆 Leyenda":streak>=14?"💎 Elite":streak>=7?"⚡ En racha":streak>0?"Construyendo":"—";

  // Task buckets
  const overdue=tasks.filter(t=>t.date<todayStr&&!t.done).sort((a,b)=>a.date.localeCompare(b.date));
  const todayP=tasks.filter(t=>t.date===todayStr&&!t.done);
  const todayD=tasks.filter(t=>t.date===todayStr&&t.done);
  const upcoming=tasks.filter(t=>t.date>todayStr&&!t.done).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);

  // Month calendar
  const dispDate=new Date(today.getFullYear(),today.getMonth()+monthOff,1);
  const dYear=dispDate.getFullYear(), dMonth=dispDate.getMonth();
  const daysInM=new Date(dYear,dMonth+1,0).getDate();
  const firstDow=new Date(dYear,dMonth,1).getDay();
  const mCells=[]; for(let i=0;i<firstDow;i++) mCells.push(null); for(let d=1;d<=daysInM;d++) mCells.push(d); while(mCells.length%7!==0) mCells.push(null);
  function cellBg(pct,fut){ if(fut||pct===null) return "rgba(14,24,34,0.5)"; if(pct===0) return "rgba(14,24,34,0.7)"; if(pct<0.5) return "rgba(0,201,167,0.18)"; if(pct<1) return "rgba(0,201,167,0.38)"; return G.teal; }

  // Task row
  function TaskRow({task,overdue:ov=false}){
    const timeLabel = task.startTime ? `${task.startTime}${task.endTime?` → ${task.endTime}`:""}` : "";
    return(
      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",...cardStyle(false),borderRadius:12,marginBottom:7,border:`1px solid ${ov?"rgba(255,183,3,0.2)":"rgba(255,255,255,0.07)"}`}}>
        <button onClick={()=>toggleTask(task.id)} style={{marginTop:2,width:20,height:20,borderRadius:"50%",border:`2px solid ${task.done?G.teal:ov?G.gold:"rgba(255,255,255,0.2)"}`,background:task.done?"rgba(0,201,167,0.15)":"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:G.teal,fontWeight:800}}>
          {task.done?"✓":""}
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:task.done?"rgba(255,255,255,0.3)":G.text,textDecoration:task.done?"line-through":"none"}}>{task.title}</div>
          {(timeLabel||ov)&&<div style={{fontSize:11,color:ov?G.gold:G.sub,marginTop:3}}>{ov?`Venció el ${taskDateLabel(task.date)}`:`⏰ ${timeLabel}`}</div>}
          {task.note&&<div style={{fontSize:11,color:G.sub,marginTop:2}}>{task.note}</div>}
        </div>
        <button onClick={()=>buildICS(task,flash)} title="Guardar en calendario" style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:G.sub,padding:"2px 3px"}}>📅</button>
        <button onClick={()=>deleteTask(task.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:G.dim,padding:"2px 3px",lineHeight:1}}>×</button>
      </div>
    );
  }

  // Main render
  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100vh",background:`radial-gradient(ellipse at 30% 0%, rgba(0,180,216,0.06) 0%, transparent 60%), ${G.bg}`,color:G.text,maxWidth:430,margin:"0 auto",paddingBottom:84}}>

      {/* ═══ HEADER ═══ */}
      <div style={{padding:"30px 20px 18px",background:"linear-gradient(180deg,rgba(14,24,34,0.95) 0%,transparent 100%)",backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
        <div style={{fontSize:10,letterSpacing:4,color:G.sub,textTransform:"uppercase",marginBottom:12}}>
          {DAYS_FULL[todayDow]} · {today.getDate()} {MONTHS_ES[today.getMonth()]} {today.getFullYear()}
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:5,color:G.teal,textTransform:"uppercase",marginBottom:1}}>MIS</div>
          <div style={{fontSize:44,fontWeight:900,letterSpacing:3,color:"#fff",textTransform:"uppercase",lineHeight:0.95,marginBottom:10,textShadow:`0 0 80px ${G.tealGlow}`}}>HÁBITOS</div>
          <div style={{width:48,height:3,background:`linear-gradient(90deg,${G.teal},transparent)`,borderRadius:2}}/>
        </div>
        {/* Progress + Streak */}
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:14,...cardStyle(false),borderRadius:16,padding:"14px 16px"}}>
            <div style={{position:"relative",width:50,height:50,flexShrink:0}}>
              <svg width="50" height="50" style={{transform:"rotate(-90deg)"}}>
                <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5"/>
                <circle cx="25" cy="25" r="21" fill="none" stroke={pct===100?G.teal:"#00B4D8"} strokeWidth="4.5" strokeDasharray={`${2*Math.PI*21}`} strokeDashoffset={`${2*Math.PI*21*(1-pct/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset .5s", filter:`drop-shadow(0 0 6px ${G.tealGlow})`}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:G.teal}}>{pct}%</div>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:pct===100?G.teal:G.text}}>{pct===100?"¡DÍA COMPLETO! 🔥":pct>=50?"VAS BIEN":"EMPECEMOS"}</div>
              <div style={{fontSize:11,color:G.sub,marginTop:2}}>{doneSlots}/{totSlots} hábitos</div>
            </div>
          </div>
          <div style={{width:88,...cardStyle(streak>0),borderRadius:16,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
            <span style={{fontSize:20}}>🔥</span>
            <div style={{fontSize:30,fontWeight:900,color:streak>0?G.gold:G.dim,lineHeight:1}}>{streak}</div>
            <div style={{fontSize:9,letterSpacing:1,color:G.sub,textTransform:"uppercase"}}>días</div>
            <div style={{fontSize:9,color:streak>0?"rgba(255,183,3,0.6)":G.dim,textAlign:"center"}}>{streakLabel}</div>
          </div>
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <div style={{display:"flex",borderBottom:`1px solid rgba(255,255,255,0.07)`,padding:"0 20px",background:"rgba(6,10,13,0.8)",backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
        {[["today","Hoy"],["week","Historial"],["manage","Editar"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${view===v?G.teal:"transparent"}`,color:view===v?G.teal:G.sub,padding:"13px 4px",cursor:"pointer",fontSize:13,fontWeight:view===v?700:400,transition:"all .2s",marginBottom:-1}}>{l}</button>
        ))}
      </div>

      {/* ═══════ HOY ═══════ */}
      {view==="today"&&(
        <div style={{padding:"16px"}}>
          {habits.map(habit=>{
            if(!isApplicable(habit,today)) return null;
            const sd=!habit.twice&&isDone(habit.id,todayStr,logs);
            const md=habit.twice&&isTwiceDone(habit.id,todayStr,"m",logs);
            const nd=habit.twice&&isTwiceDone(habit.id,todayStr,"n",logs);
            const full=habit.twice?(md&&nd):sd; const half=habit.twice&&(md||nd)&&!(md&&nd);
            const wkc=habit.type==="limit"?limitWeekCount(habit.id,wkStart,logs):0;
            const over=habit.type==="limit"&&wkc>habit.maxPerWeek;
            const hs=habit.type==="goal"&&!habit.twice&&!habit.weeklyTarget?goalStreak(habit.id,logs):0;
            const wkg=habit.weeklyTarget?weeklyGoalCount(habit.id,wkStart,logs):0;
            const wm=!!(habit.weeklyTarget&&wkg>=habit.weeklyTarget);
            const lit=full||half||wm; const ac=over?G.danger:habit.color;
            return(
              <div key={habit.id} style={{...cardStyle(lit,habit.color),borderRadius:16,padding:"15px",marginBottom:10,transition:"all .25s"}}>
                <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:habit.twice?12:0}}>
                  <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:lit?`${ac}22`:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`1px solid ${lit?ac+"44":"rgba(255,255,255,0.08)"}`,transition:"all .2s"}}>{habit.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{habit.name}</div>
                    <div style={{fontSize:11,color:G.sub}}>{habit.note}</div>
                  </div>
                  {habit.type==="limit"&&(<div style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:over?"rgba(239,71,111,0.15)":"rgba(255,255,255,0.06)",color:over?G.danger:wkc>=habit.maxPerWeek?G.gold:G.sub,border:`1px solid ${over?"rgba(239,71,111,0.3)":"rgba(255,255,255,0.1)"}`}}>{wkc}/{habit.maxPerWeek}</div>)}
                  {habit.weeklyTarget&&(<div style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:wm?`${ac}22`:"rgba(255,255,255,0.06)",color:wm?ac:G.sub,border:`1px solid ${wm?ac+"44":"rgba(255,255,255,0.1)"}`}}>{wkg}/{habit.weeklyTarget} sem</div>)}
                  {habit.type==="goal"&&!habit.twice&&!habit.weeklyTarget&&hs>1&&(<div style={{fontSize:11,color:G.sub}}>🔥{hs}d</div>)}
                </div>
                {habit.twice&&(
                  <div style={{display:"flex",gap:8}}>
                    {[["m","☀️ Mañana",md],["n","🌙 Noche",nd]].map(([sl,lb,done])=>(
                      <button key={sl} onClick={()=>toggleTwice(habit.id,todayStr,sl)} style={{flex:1,padding:"9px 8px",borderRadius:10,cursor:"pointer",background:done?`${ac}22`:"rgba(255,255,255,0.04)",border:`1px solid ${done?ac+"55":"rgba(255,255,255,0.08)"}`,color:done?ac:G.sub,fontSize:13,fontWeight:600,transition:"all .2s"}}>{lb}{done?" ✓":""}</button>
                    ))}
                  </div>
                )}
                {!habit.twice&&(
                  <button onClick={()=>toggleSingle(habit.id,todayStr)} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:10,cursor:"pointer",background:(sd||wm)?`${ac}22`:"rgba(255,255,255,0.04)",border:`1px solid ${(sd||wm)?ac+"55":"rgba(255,255,255,0.08)"}`,color:(sd||wm)?ac:G.sub,fontSize:13,fontWeight:600,transition:"all .2s"}}>
                    {habit.type==="limit"?(sd?"✓ Registrado — toca para desmarcar":"Registrar para hoy"):habit.weeklyTarget?(wm&&!sd?"✓ Meta semanal cumplida":sd?"✓ Hecho hoy — toca para desmarcar":"Marcar como hecho"):(sd?"✓ Completado — toca para desmarcar":"Marcar como hecho")}
                  </button>
                )}
              </div>
            );
          })}
          {todaySkipped.length>0&&(
            <div style={{marginTop:14}}>
              <div style={{fontSize:10,letterSpacing:3,color:G.dim,textTransform:"uppercase",marginBottom:8}}>No aplica hoy</div>
              {todaySkipped.map(h=>(<div key={h.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(14,24,34,0.4)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:12,marginBottom:6,opacity:0.4}}><span style={{fontSize:17}}>{h.emoji}</span><span style={{fontSize:13,color:G.sub}}>{h.name}</span><span style={{marginLeft:"auto",fontSize:11,color:G.dim}}>{h.note}</span></div>))}
            </div>
          )}

          {/* ═══ TAREAS ═══ */}
          <div style={{marginTop:24,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,letterSpacing:3,color:G.sub,textTransform:"uppercase"}}>Tareas</div>
              
            </div>
            {overdue.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:9,letterSpacing:2,color:G.gold,textTransform:"uppercase",marginBottom:8}}>⚠ Vencidas</div>{overdue.map(t=><TaskRow key={t.id} task={t} overdue={true}/>)}</div>}
            {todayP.map(t=><TaskRow key={t.id} task={t}/>)}
            {todayD.map(t=><TaskRow key={t.id} task={t}/>)}
            {overdue.length===0&&todayP.length===0&&todayD.length===0&&(<div style={{textAlign:"center",color:G.dim,fontSize:13,padding:"14px 0"}}>Sin tareas para hoy</div>)}
            {upcoming.length>0&&(
              <div style={{marginTop:14}}>
                <div style={{fontSize:9,letterSpacing:2,color:G.dim,textTransform:"uppercase",marginBottom:8}}>Próximas</div>
                {upcoming.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:"rgba(14,24,34,0.5)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,marginBottom:5}}>
                    <div style={{fontSize:10,color:G.sub,minWidth:64,flexShrink:0}}>{taskDateLabel(t.date)}</div>
                    {t.startTime&&<div style={{fontSize:10,color:G.dim,flexShrink:0}}>⏰{t.startTime}</div>}
                    <div style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                    <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:G.dim,padding:"2px"}}>×</button>
                  </div>
                ))}
              </div>
            )}
            {/* Add task form */}
            {showAddTask&&(
              <div style={{background:"rgba(8,14,20,0.94)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"22px 16px 16px",marginTop:12,boxShadow:"0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)"}}>
                <div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:2,margin:"0 auto 18px"}}/>
                <div style={{fontWeight:800,fontSize:11,color:G.gold,letterSpacing:3,textTransform:"uppercase",marginBottom:20,textAlign:"center"}}>Nueva tarea</div>
                <div style={{marginBottom:10}}><input placeholder="¿Qué tenés que hacer?" value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} style={IS} autoFocus/></div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><label style={{fontSize:9,color:G.sub,display:"block",marginBottom:5,letterSpacing:2}}>FECHA</label><input type="date" value={newTask.date} onChange={e=>setNewTask(p=>({...p,date:e.target.value}))} style={{...IS,colorScheme:"dark"}}/></div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><label style={{fontSize:9,color:G.sub,display:"block",marginBottom:5,letterSpacing:2}}>HORA INICIO</label><input type="time" value={newTask.startTime} onChange={e=>setNewTask(p=>({...p,startTime:e.target.value}))} style={{...IS,colorScheme:"dark"}}/></div>
                  <div style={{flex:1}}><label style={{fontSize:9,color:G.sub,display:"block",marginBottom:5,letterSpacing:2}}>HORA FIN</label><input type="time" value={newTask.endTime} onChange={e=>setNewTask(p=>({...p,endTime:e.target.value}))} style={{...IS,colorScheme:"dark"}}/></div>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:9,color:G.sub,display:"block",marginBottom:6,letterSpacing:2}}>RECORDATORIO</label>
                  <div style={{display:"flex",gap:6}}>
                    {[[0,"Sin aviso"],[15,"15 min"],[60,"1 hora"],[1440,"1 día"]].map(([m,l])=>(
                      <button key={m} onClick={()=>setNewTask(p=>({...p,reminderMin:m}))} style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",border:`1px solid ${newTask.reminderMin===m?G.tealBorder:"rgba(255,255,255,0.08)"}`,background:newTask.reminderMin===m?G.tealDim:"transparent",color:newTask.reminderMin===m?G.teal:G.sub,fontSize:11,fontWeight:newTask.reminderMin===m?700:400}}>{l}</button>
                    ))}
                  </div>
                  {newTask.reminderMin>0&&<div style={{fontSize:10,color:G.sub,marginTop:6,paddingLeft:2}}>💡 Al guardar en el calendario se creará el recordatorio automáticamente</div>}
                </div>
                <div style={{marginBottom:12}}><input placeholder="Nota (opcional)" value={newTask.note} onChange={e=>setNewTask(p=>({...p,note:e.target.value}))} style={IS}/></div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setShowAddTask(false)} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 0",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14}}>Cancelar</button>
                  <button onClick={addTask} style={{flex:2,background:"linear-gradient(135deg,#FFB703 0%,#FF8C00 100%)",border:"none",borderRadius:14,padding:"13px 0",color:"#060A0D",cursor:"pointer",fontSize:14,fontWeight:800,boxShadow:"0 4px 20px rgba(255,183,3,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"}}>Agregar tarea</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ HISTORIAL ═══════ */}
      {view==="week"&&(
        <div style={{padding:"16px"}}>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {[["week","7 días"],["month","Mes completo"]].map(([v,l])=>(
              <button key={v} onClick={()=>setHistView(v)} style={{flex:1,padding:"9px 8px",borderRadius:10,cursor:"pointer",...cardStyle(histView===v),color:histView===v?G.teal:G.sub,fontSize:13,fontWeight:histView===v?700:400,border:`1px solid ${histView===v?G.tealBorder:"rgba(255,255,255,0.07)"}`}}>{l}</button>
            ))}
          </div>
          {histView==="week"&&(
            <>
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"108px repeat(7,1fr)",gap:3,marginBottom:10,minWidth:360}}>
                  <div/>
                  {days7.map((d,i)=>{ const it=toDateStr(d)===todayStr; return(<div key={i} style={{textAlign:"center"}}><div style={{fontSize:9,letterSpacing:1,color:it?G.text:G.sub,fontWeight:700,textTransform:"uppercase"}}>{DAYS_ES[d.getDay()]}</div><div style={{width:26,height:26,borderRadius:"50%",margin:"3px auto 0",background:it?G.tealDim:"transparent",border:it?`1px solid ${G.tealBorder}`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:it?G.teal:G.sub,fontWeight:600}}>{d.getDate()}</div></div>);})}
                </div>
                {habits.map(habit=>(
                  <div key={habit.id} style={{display:"grid",gridTemplateColumns:"108px repeat(7,1fr)",gap:3,marginBottom:5,alignItems:"center",minWidth:360}}>
                    <div style={{fontSize:11,color:G.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",paddingRight:4}}>{habit.emoji} {habit.name}</div>
                    {days7.map((d,i)=>{
                      const ds=toDateStr(d);
                      if(!isApplicable(habit,d)) return(<div key={i} style={{height:34,borderRadius:8,background:"rgba(14,24,34,0.4)",border:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:G.dim}}>—</div>);
                      if(habit.twice){ const m=isTwiceDone(habit.id,ds,"m",logs),n=isTwiceDone(habit.id,ds,"n",logs); return(<div key={i} style={{height:34,borderRadius:8,overflow:"hidden",display:"flex",flexDirection:"column",gap:1,cursor:"pointer",border:`1px solid ${(m||n)?habit.color+"44":"rgba(255,255,255,0.07)"}`}} onClick={()=>{ if(!m&&!n){setLog(`${habit.id}|${ds}|m`,true);flash("Mañana ✓");}else if(m&&!n){setLog(`${habit.id}|${ds}|n`,true);flash("Noche ✓");}else{setLog(`${habit.id}|${ds}|m`,false);setLog(`${habit.id}|${ds}|n`,false);flash("Desmarcado");} }}><div style={{flex:1,background:m?`${habit.color}50`:"rgba(14,24,34,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,color:m?habit.color:G.dim}}>☀</span></div><div style={{flex:1,background:n?`${habit.color}50`:"rgba(14,24,34,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,color:n?habit.color:G.dim}}>🌙</span></div></div>); }
                      const done=isDone(habit.id,ds,logs);
                      return(<div key={i} onClick={()=>{ if(habit.type==="limit"){const nx=!done;if(nx){const c=limitWeekCount(habit.id,weekOf(ds),{...logs,[`${habit.id}|${ds}`]:true});if(c>habit.maxPerWeek){flash(`⚠ Límite: máx ${habit.maxPerWeek} días/sem`,false);return;}}setLog(`${habit.id}|${ds}`,nx);flash(nx?"Registrado ✓":"Desmarcado");}else{setLog(`${habit.id}|${ds}`,!done);flash(!done?"✓":"Desmarcado");}}} style={{height:34,borderRadius:8,cursor:"pointer",background:done?`${habit.color}40`:"rgba(14,24,34,0.6)",border:`1px solid ${done?habit.color+"55":"rgba(255,255,255,0.07)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:done?habit.color:G.dim,fontWeight:700,transition:"all .15s"}}>{done?"✓":""}</div>);
                    })}
                  </div>
                ))}
              </div>
              <div style={{marginTop:22,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:18}}>
                <div style={{fontSize:10,letterSpacing:3,color:G.sub,textTransform:"uppercase",marginBottom:14}}>Resumen semanal</div>
                {habits.map(habit=>{
                  let done,target,p,label;
                  if(habit.twice){ const ap=days7.filter(d=>isApplicable(habit,d)); target=ap.length*2; done=ap.reduce((a,d)=>{ const ds=toDateStr(d); return a+(logs[`${habit.id}|${ds}|m`]?1:0)+(logs[`${habit.id}|${ds}|n`]?1:0); },0); p=target>0?Math.min(done/target,1):0; label=`${done}/${target} turnos`; }
                  else if(habit.type==="limit"){ done=limitWeekCount(habit.id,wkStart,logs); target=habit.maxPerWeek; p=Math.min(done/target,1); label=`${done}/${target} máx`; }
                  else if(habit.weeklyTarget){ done=weeklyGoalCount(habit.id,wkStart,logs); target=habit.weeklyTarget; p=Math.min(done/target,1); label=`${done}/${target} veces`; }
                  else{ const ap=days7.filter(d=>isApplicable(habit,d)); target=ap.length; done=ap.filter(d=>logs[`${habit.id}|${toDateStr(d)}`]).length; p=target>0?done/target:0; label=`${done}/${target} días`; }
                  const barColor=habit.type==="limit"&&done>target?G.danger:p===1?G.teal:habit.color;
                  return(<div key={habit.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:G.sub}}>{habit.emoji} {habit.name}</span><span style={{color:p>=1?barColor:"rgba(255,255,255,0.25)"}}>{label}</span></div><div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${p*100}%`,background:barColor,borderRadius:4,transition:"width .3s",boxShadow:p>=1?`0 0 8px ${barColor}88`:"none"}}/></div></div>);
                })}
              </div>
            </>
          )}
          {histView==="month"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <button onClick={()=>setMonthOff(o=>o-1)} style={{background:"none",border:"none",color:G.sub,cursor:"pointer",fontSize:24,padding:"4px 8px"}}>‹</button>
                <div style={{fontWeight:700,fontSize:15,color:G.text,letterSpacing:1,textTransform:"uppercase"}}>{MONTHS_ES[dMonth]} {dYear}</div>
                <button onClick={()=>setMonthOff(o=>Math.min(o+1,0))} style={{background:"none",border:"none",color:monthOff===0?G.dim:G.sub,cursor:monthOff===0?"default":"pointer",fontSize:24,padding:"4px 8px"}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
                {DAYS_ES.map(d=>(<div key={d} style={{textAlign:"center",fontSize:9,letterSpacing:1,color:G.sub,textTransform:"uppercase",padding:"4px 0"}}>{d}</div>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:18}}>
                {mCells.map((day,i)=>{ if(!day) return <div key={i} style={{aspectRatio:"1"}}/>; const date=new Date(dYear,dMonth,day); const fut=date>today; const it=toDateStr(date)===todayStr; const dp=fut?null:getDayPct(date,habits,logs); const bg=cellBg(dp,fut); return(<div key={i} style={{aspectRatio:"1",borderRadius:8,background:bg,border:it?`1.5px solid ${G.teal}`:`1px solid ${fut?"rgba(255,255,255,0.04)":"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:it?800:400,color:dp===1?"#060A0D":it?G.teal:fut?G.dim:"rgba(255,255,255,0.5)",transition:"background .2s",boxShadow:dp===1?`0 2px 12px ${G.tealGlow}`:"none"}}>{day}</div>); })}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:18}}>
                {[["rgba(14,24,34,0.7)","0%"],["rgba(0,201,167,0.18)","1–49%"],["rgba(0,201,167,0.38)","50–99%"],[G.teal,"100%"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:12,height:12,borderRadius:3,background:c}}/><span style={{fontSize:10,color:G.sub}}>{l}</span></div>))}
              </div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:16}}>
                {(()=>{ let pf=0,pa=0,z=0; for(let d=1;d<=daysInM;d++){ const dt=new Date(dYear,dMonth,d); if(dt>today) continue; const p=getDayPct(dt,habits,logs); if(p===null) continue; if(p===1) pf++; else if(p>0) pa++; else z++; } return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["✅","Completos",pf,G.teal],["⚡","Parciales",pa,G.gold],["○","Sin marcar",z,G.sub]].map(([icon,l,v,c])=>(<div key={l} style={{...cardStyle(false),borderRadius:12,padding:"12px 8px",textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>{icon}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:10,color:G.sub,marginTop:2}}>{l}</div></div>))}</div>); })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ EDITAR ═══════ */}
      {view==="manage"&&(
        <div style={{padding:"16px"}}>
          {habits.map(h=>(
            <div key={h.id}>
              {editHabitId===h.id?(
                <HabitForm initial={h} title="EDITAR HÁBITO" onSave={saveHabit} onCancel={()=>setEditHabitId(null)}/>
              ):(
                <div style={{...cardStyle(false),borderLeft:`3px solid ${h.type==="goal"?h.color:G.danger}`,borderRadius:12,padding:"13px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>{h.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{h.name}</div>
                    <div style={{fontSize:11,color:G.sub,marginTop:2}}>{h.note}</div>
                  </div>
                  <div style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:10,letterSpacing:1,background:h.type==="goal"?"rgba(0,201,167,0.1)":"rgba(239,71,111,0.1)",color:h.type==="goal"?G.teal:G.danger,border:`1px solid ${h.type==="goal"?"rgba(0,201,167,0.2)":"rgba(239,71,111,0.2)"}`}}>{h.type==="goal"?"META":"LÍMITE"}</div>
                  <button onClick={()=>{ setEditHabitId(h.id); }} title="Editar" style={{background:"rgba(0,201,167,0.08)",border:"1px solid rgba(0,201,167,0.2)",borderRadius:10,color:G.teal,cursor:"pointer",fontSize:14,padding:"6px 10px"}}>✏</button>
                  <button onClick={()=>deleteHabit(h.id)} style={{background:"none",border:"none",color:G.dim,cursor:"pointer",fontSize:20,lineHeight:1,padding:4}}>×</button>
                </div>
              )}
            </div>
          ))}
          {!showAddHabit?(
            <button onClick={()=>setShowAddHabit(true)} style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"2px dashed rgba(255,255,255,0.1)",borderRadius:12,padding:18,color:G.sub,cursor:"pointer",fontSize:14,marginTop:4}}>+ Agregar hábito</button>
          ):(
            <HabitForm initial={blankHabit()} title="NUEVO HÁBITO" onSave={saveHabit} onCancel={()=>setShowAddHabit(false)}/>
          )}
        </div>
      )}

      {/* Toast */}
      {toast&&(<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:toast.ok?"rgba(0,201,167,0.15)":"rgba(239,71,111,0.15)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`1px solid ${toast.ok?G.tealBorder:"rgba(239,71,111,0.3)"}`,color:toast.ok?G.teal:G.danger,padding:"10px 22px",borderRadius:24,fontSize:13,fontWeight:600,whiteSpace:"nowrap",zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>{toast.msg}</div>)}

      {/* ── FAB ── */}
      {showFAB&&<div onClick={()=>setShowFAB(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:140}}/>}
      <div style={{position:"fixed",bottom:84,right:16,zIndex:150,display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
        {showFAB&&(
          <div style={{background:"rgba(10,18,26,0.92)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.11)",borderRadius:28,padding:"20px 16px 16px",marginBottom:14,width:270,boxShadow:"0 24px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.1)"}}>
            {/* Handle */}
            <div style={{width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 18px",flexShrink:0}}/>
            <div style={{fontSize:9,letterSpacing:3,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:14,textAlign:"center"}}>Agregar nuevo</div>

            {/* Habit option */}
            <button onClick={()=>{ setShowFAB(false); setView("manage"); setShowAddHabit(true); setEditHabitId(null); }} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 14px",background:"linear-gradient(135deg,rgba(0,201,167,0.13) 0%,rgba(0,180,216,0.07) 100%)",border:"1px solid rgba(0,201,167,0.22)",borderRadius:18,cursor:"pointer",marginBottom:10,textAlign:"left",boxShadow:"inset 0 1px 0 rgba(0,201,167,0.15), 0 2px 12px rgba(0,201,167,0.08)"}}>
              <div style={{width:44,height:44,borderRadius:14,background:"rgba(0,201,167,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"1px solid rgba(0,201,167,0.25)",flexShrink:0}}>🔄</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:G.teal,marginBottom:2}}>Hábito recurrente</div>
                <div style={{fontSize:11,color:G.sub,lineHeight:1.3}}>Diario, semanal, con frecuencia</div>
              </div>
              <div style={{color:"rgba(0,201,167,0.35)",fontSize:18,fontWeight:300}}>›</div>
            </button>

            {/* Task option */}
            <button onClick={()=>{ setShowFAB(false); setView("today"); openAddTask(); }} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 14px",background:"linear-gradient(135deg,rgba(255,183,3,0.11) 0%,rgba(255,140,0,0.06) 100%)",border:"1px solid rgba(255,183,3,0.2)",borderRadius:18,cursor:"pointer",textAlign:"left",boxShadow:"inset 0 1px 0 rgba(255,183,3,0.12), 0 2px 12px rgba(255,183,3,0.06)"}}>
              <div style={{width:44,height:44,borderRadius:14,background:"rgba(255,183,3,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"1px solid rgba(255,183,3,0.22)",flexShrink:0}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:G.gold,marginBottom:2}}>Tarea / Recordatorio</div>
                <div style={{fontSize:11,color:G.sub,lineHeight:1.3}}>Una vez, fecha y hora específica</div>
              </div>
              <div style={{color:"rgba(255,183,3,0.35)",fontSize:18,fontWeight:300}}>›</div>
            </button>
          </div>
        )}

        {/* FAB button */}
        <button onClick={()=>setShowFAB(!showFAB)} style={{width:56,height:56,borderRadius:"50%",background:showFAB?"rgba(255,255,255,0.08)":`linear-gradient(145deg,${G.teal} 0%,#00B4D8 100%)`,border:showFAB?"1px solid rgba(255,255,255,0.15)":"none",cursor:"pointer",color:"#fff",boxShadow:showFAB?"0 4px 20px rgba(0,0,0,0.5)":`0 6px 28px rgba(0,201,167,0.5), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35)`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s",backdropFilter:showFAB?"blur(16px)":"none",WebkitBackdropFilter:showFAB?"blur(16px)":"none"}}>
          <span style={{fontSize:24,fontWeight:300,lineHeight:1,display:"block",transform:showFAB?"rotate(45deg)":"rotate(0deg)",transition:"transform .25s"}}>{showFAB?"✕":"+"}</span>
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,10,13,0.92)",backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderTop:"1px solid rgba(255,255,255,0.07)",padding:"10px 0 20px",display:"flex",justifyContent:"space-around"}}>
        {[["today","📅","Hoy"],["week","📊","Historial"],["manage","⚙️","Editar"]].map(([v,icon,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{background:"none",border:"none",cursor:"pointer",color:view===v?G.teal:G.dim,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 24px"}}>
            <span style={{fontSize:22,filter:view===v?`drop-shadow(0 0 8px ${G.tealGlow})`:""}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:view===v?700:400}}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
