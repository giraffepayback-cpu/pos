const layoutData = {
  "areas": [
    {
      "id": "og",
      "name": "Obergeschoss",
      "grid": {"columns": 5, "rows": 8},
      "tables": [
        {"id": 101, "x": 4, "y": 5}, {"id": 102, "x": 5, "y": 4}, {"id": 103, "x": 5, "y": 3}, {"id": 104, "x": 5, "y": 2},
        {"id": 105, "x": 5, "y": 1}, {"id": 106, "x": 4, "y": 1}, {"id": 107, "x": 3, "y": 2}, {"id": 108, "x": 2, "y": 1}, {"id": 109, "x": 1, "y": 1},
        {"id": 110, "x": 1, "y": 2}, {"id": 111, "x": 1, "y": 3}, {"id": 112, "x": 1, "y": 4}, {"id": 113, "x": 2, "y": 5}, {"id": 114, "x": 1, "y": 6},
	{"id": 115, "x": 1, "y": 7}, {"id": 116, "x": 1, "y": 8}
      ]
    },
    {
      "id": "eg",
      "name": "Erdgeschoss",
      "grid": {"columns": 3, "rows": 2},
      "tables": [
        {"id": 21, "x": 1, "y": 1}, {"id": 22, "x": 2, "y": 1}, {"id": 23, "x": 3, "y": 1},
        {"id": 24, "x": 1, "y": 2}, {"id": 25, "x": 2, "y": 2}, {"id": 26, "x": 3, "y": 2}
      ]
    },
    {
      "id": "terrasse",
      "name": "Terrasse",
      "grid": {"columns": 5, "rows": 4},
      "tables": [
        {"id": 101, "x": 1, "y": 1}, {"id": 102, "x": 2, "y": 1}, {"id": 103, "x": 3, "y": 1}, {"id": 104, "x": 4, "y": 1}, {"id": 105, "x": 5, "y": 1},
        {"id": 106, "x": 1, "y": 3}, {"id": 107, "x": 2, "y": 3}, {"id": 108, "x": 3, "y": 3}, {"id": 109, "x": 4, "y": 3}, {"id": 110, "x": 5, "y": 3}
      ]
    }
  ]
};

const layoutEl=document.getElementById('layout');
const viewSelect=document.getElementById('viewSelect');
const overlay=document.getElementById('overlay');
const overlayTitle=document.getElementById('overlayTitle');
const backBtn=document.getElementById('backBtn');
const btnOccupied=document.getElementById('btnOccupied');
const btnFree=document.getElementById('btnFree');
const btnPaid=document.getElementById('btnPaid');
const importJson=document.getElementById('importJson');

const contextMenu = document.getElementById('contextMenu');
const ctxTitle = document.getElementById('ctxTitle');
const ctxMove = document.getElementById('ctxMove');
const ctxServed = document.getElementById('ctxServed');
const ctxReminder = document.getElementById('ctxReminder');
const ctxReminderText = document.getElementById('ctxReminderText');

const STORAGE_KEY='pos-table-state';
let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
let activeTableId=null;
let contextTableId=null;

function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function getTableState(id){ if(!state[id]) state[id]={status:'free',since:null}; return state[id]; }
function getColor(s){
  if(s.status==='reminder') return 'var(--reminder)';
  if(s.status==='paid') return 'var(--paid)';
  if(s.status==='occupied'){
    const mins=(Date.now()-s.since)/60000;
    if(mins>=30) return 'var(--occupied-red)';
    if(mins>=15) return 'var(--occupied-yellow)';
    return 'var(--occupied-green)';
  }
  return 'var(--free)';
}

/* ---------- render ---------- */
function render(view){
  layoutEl.innerHTML='';
  layoutData.areas.filter(a=>view==='all'||a.id===view).forEach(area=>{
    const section=document.createElement('section');
    section.className='area';
    const h2=document.createElement('h2');
    h2.textContent=area.name;
    section.appendChild(h2);

    const grid=document.createElement('div');
    grid.className='grid';
    grid.style.gridTemplateColumns=`repeat(${area.grid.columns},1fr)`;

    area.tables.forEach(t=>{
      const s=getTableState(t.id);
      const el=document.createElement('div');
      el.className='table';
      el.style.gridColumn=t.x;
      el.style.gridRow=t.y;
      el.style.background=getColor(s);
      el.textContent=`Tisch ${t.id}`;

      const timerEl=document.createElement('small');
      el.appendChild(timerEl);

      let lastTap = 0;
let tapTimeout;

el.addEventListener('touchend', e => {
  const now = Date.now();

  if (now - lastTap < 300) {
    // Doppeltipp → schnelle Erinnerung
    const s = getTableState(t.id);
    s.status = 'reminder';
    s.since = s.since || Date.now();
    saveState();
    render(viewSelect.value);

    clearTimeout(tapTimeout); // Overlay verhindern
  } else {
    // Einzeltipp → Overlay verzögert öffnen
    tapTimeout = setTimeout(() => {
      activeTableId = t.id;
      overlayTitle.textContent = `Tisch ${t.id}`;
      overlay.style.display = 'block';
    }, 300); // Warte kurz, ob Doppeltipp kommt
  }

  lastTap = now;
});

      // LongPress → Kontextmenü
      let longPress;
      el.addEventListener('touchstart',()=>{
        longPress=setTimeout(()=>{
          contextTableId=t.id;
          const rect = el.getBoundingClientRect();
          contextMenu.style.top = `${rect.bottom + window.scrollY}px`;
          contextMenu.style.left = `${rect.left + window.scrollX}px`;
          ctxTitle.textContent=`Tisch ${t.id}`;
          const st=getTableState(t.id);
          ctxReminderText.textContent = st.reminderText || '';
          contextMenu.style.display='block';
        },600);
      });
      el.addEventListener('touchend',()=>clearTimeout(longPress));

      grid.appendChild(el);
    });

    section.appendChild(grid);
    layoutEl.appendChild(section);
  });
}

/* ---------- overlay ---------- */
backBtn.onclick=()=>overlay.style.display='none';
btnOccupied.onclick=()=>{
  const s=getTableState(activeTableId);
  s.status='occupied';
  s.since=Date.now();
  saveState();
  overlay.style.display='none';
  render(viewSelect.value);
};
btnFree.onclick=()=>{
  const s=getTableState(activeTableId);
  s.status='free';
  s.since=null;
  saveState();
  overlay.style.display='none';
  render(viewSelect.value);
};
btnPaid.onclick=()=>{
  const s=getTableState(activeTableId);
  s.status='paid';
  s.since=Date.now();
  saveState();
  overlay.style.display='none';
  render(viewSelect.value);
};

/* ---------- Kontextmenü Buttons ---------- */
ctxMove.onclick = () => {
  const newTable = prompt('Auf welchen Tisch verschieben?');
  alert(`Bestellung verschieben auf Tisch ${newTable} (funktional noch nicht implementiert)`);
  contextMenu.style.display='none';
};
ctxServed.onclick = () => {
  const s = getTableState(contextTableId);
  s.status='occupied';
  s.since=Date.now();
  saveState();
  contextMenu.style.display='none';
  render(viewSelect.value);
};
ctxReminder.onclick = () => {
  const text = prompt('Erinnerungstext (optional):','');
  const s = getTableState(contextTableId);
  s.status='reminder';
  s.since = s.since||Date.now();
  s.reminderText = text;
  saveState();
  contextMenu.style.display='none';
  render(viewSelect.value);
};

// Klick außerhalb Kontextmenü schließt es
document.addEventListener('click',e=>{
  if(!contextMenu.contains(e.target) && !e.target.classList.contains('table')){
    contextMenu.style.display='none';
  }
});

/* ---------- JSON Import ---------- */
importJson.addEventListener('change',e=>{
  const file=e.target.files[0];
  const reader=new FileReader();
  reader.onload=evt=>{
    try{
      const json=JSON.parse(evt.target.result);
      layoutData.areas=json.areas;
      state={};
      saveState();
      render(viewSelect.value);
    }catch(err){
      alert('Ungültiges JSON');
    }
  };
  reader.readAsText(file);
});

/* ---------- Init ---------- */
layoutData.areas.forEach(a=>{
  const opt=document.createElement('option');
  opt.value=a.id;
  opt.textContent=a.name;
  viewSelect.appendChild(opt);
});
viewSelect.onchange=e=>render(e.target.value);

render('all');

/* ---------- Timer Update ---------- */
setInterval(()=>{
  layoutData.areas.forEach(area=>{
    area.tables.forEach(t=>{
      const s=getTableState(t.id);
      const el=[...layoutEl.querySelectorAll('.table')].find(x=>x.textContent.includes(`Tisch ${t.id}`));
      if(el){
        const timerEl=el.querySelector('small');
        if(s.status==='occupied'||s.status==='reminder'||s.status==='paid'){
          const mins=Math.floor((Date.now()-s.since)/60000);
          timerEl.textContent=`${mins} min`;
        } else timerEl.textContent='';
      }
    });
  });
},1000);
