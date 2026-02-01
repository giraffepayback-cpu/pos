/* ================== DATA ================== */

let layoutData = {
  "areas": [
    {
      "id": "og", "name": "Obergeschoss", "grid": {"columns": 5, "rows": 8},
      "tables": [
        {"id": 101, "x": 4, "y": 4}, {"id": 102, "x": 5, "y": 5}, {"id": 103, "x": 5, "y": 3}, {"id": 104, "x": 5, "y": 2},
        {"id": 105, "x": 5, "y": 1}, {"id": 106, "x": 4, "y": 1}, {"id": 107, "x": 3, "y": 2}, {"id": 108, "x": 2, "y": 1}, 
        {"id": 109, "x": 1, "y": 1}, {"id": 110, "x": 1, "y": 2}, {"id": 111, "x": 1, "y": 3}, {"id": 112, "x": 1, "y": 5}, 
        {"id": 113, "x": 2, "y": 4}, {"id": 114, "x": 1, "y": 6}, {"id": 115, "x": 1, "y": 7}, {"id": 116, "x": 1, "y": 8}
      ]
    },
    {
      "id": "eg", "name": "Erdgeschoss", "grid": {"columns": 7, "rows": 3},
      "tables": [
        {"id": 1, "x": 1, "y": 3}, {"id": 2, "x": 1, "y": 1}, {"id": 3, "x": 3, "y": 1},
        {"id": 4, "x": 5, "y": 1}, {"id": 5, "x": 7, "y": 1}, {"id": 6, "x": 7, "y": 3}, {"id": 7, "x": 4, "y": 3}
      ]
    },
    {
      "id": "terrasse", "name": "Terrasse", "grid": {"columns": 7, "rows": 1},
      "tables": [
        {"id": 27, "x": 1, "y": 1}, {"id": 28, "x": 2, "y": 1}, {"id": 29, "x": 3, "y": 1},
        {"id": 20, "x": 5, "y": 1}, {"id": 21, "x": 6, "y": 1}, {"id": 22, "x": 7, "y": 1}
      ]
    }
  ]
};

/* ================== DOM ================== */
const layoutEl = document.getElementById("layout");

// Import
document.getElementById("importJson").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      layoutData = JSON.parse(e.target.result);
      createLayout(); // Komplett neu bauen bei Import
    } catch (err) { alert("Ungültige Datei"); }
  };
  reader.readAsText(file);
});

/* ================== STATE ================== */
const STORAGE_KEY = "pos-state-v3";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTableState(id) {
  if (!state[id]) state[id] = { status: "free", since: null };
  return state[id];
}

/* ================== LOGIC & TRANSITIONS ================== */

function handleTransition(tableId, action) {
  const s = getTableState(tableId);
  const now = Date.now();
  
  // Hilfsfunktion: Status setzen
  const set = (status, resetTimer = true) => {
    s.status = status;
    if (resetTimer) s.since = now;
    if (status === "free") s.since = null;
    
    saveState();
    updateVisuals(); // Nur Farben/Text updaten, kein kompletter Re-Render
  };

  switch (s.status) {
    case "free":
      if (action === "single") set("occupied", true);     // 1: Besetzt
      if (action === "double") set("reminder", true);     // 2: Erinnerung
      if (action === "hold")   set("paid", true);         // hlt: Bezahlt
      break;

    case "occupied":
      // NEU: Reset -> Timer auf 0, Status bleibt occupied
      if (action === "single") set("occupied", true);     // 1: Reset (Timer 0)
      if (action === "double") set("reminder", false);    // 2: Erinnerung (Timer läuft weiter)
      if (action === "hold")   set("paid", true);         // hlt: Bezahlt
      break;

    case "reminder":
      // NEU: Reset -> Zurück zu Grün, Timer auf 0
      if (action === "single") set("occupied", true);     // 1: Reset (Timer 0, Grün)
      // NEU: Zurück zu Grün OHNE Reset
      if (action === "double") set("occupied", false);    // 2: Grün (Timer läuft weiter)
      if (action === "hold")   set("paid", true);         // hlt: Bezahlt
      break;

    case "paid":
      if (action === "single") set("free", true);         // 1: Frei
      if (action === "double") set("reminder", true);     // 2: Erinnerung
      if (action === "hold")   set("occupied", true);     // hlt: Besetzt
      break;
      
    default:
      set("free");
  }
}

/* ================== COLOR ================== */
function getColor(s) {
  if (s.status === "reminder") return "#9b59b6"; // Lila
  if (s.status === "paid") return "#aaa";        // Grau
  if (s.status === "occupied") {
    if (!s.since) return "#2ecc71";
    const mins = (Date.now() - s.since) / 60000;
    if (mins >= 30) return "#e74c3c"; // Rot
    if (mins >= 15) return "#f1c40f"; // Gelb
    return "#2ecc71"; // Grün
  }
  return "#666"; // Frei
}

/* ================== RENDER LOGIC (2-Step) ================== */

// 1. Erstellt nur die DOM-Struktur (einmalig oder bei Layout-Änderung)
function createLayout() {
  layoutEl.innerHTML = ""; // Clean slate

  layoutData.areas.forEach(area => {
    const h2 = document.createElement("h2");
    h2.textContent = area.name;
    h2.style.margin = "10px 10px 5px 10px";
    h2.style.fontSize = "16px";
    h2.style.color = "#ccc";
    layoutEl.appendChild(h2);

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.gridTemplateColumns = `repeat(${area.grid.columns},1fr)`;

    area.tables.forEach(t => {
      const el = document.createElement("div");
      el.className = "table";
      el.id = `table-${t.id}`; // Wichtig für Update
      el.style.gridColumn = t.x;
      el.style.gridRow = t.y;
      
      // Text Node für ID
      const idSpan = document.createElement("span");
      idSpan.textContent = t.id;
      idSpan.style.pointerEvents = "none";
      el.appendChild(idSpan);

      // Timer Node
      const timer = document.createElement("small");
      timer.id = `timer-${t.id}`;
      el.appendChild(timer);

      /* ====== EVENT LISTENERS ====== */
      attachListeners(el, t.id);

      grid.appendChild(el);
    });

    layoutEl.appendChild(grid);
  });
  
  // Initial Visuals setzen
  updateVisuals();
}

// 2. Aktualisiert nur Farben und Timer-Text (flackerfrei)
function updateVisuals() {
  const now = Date.now();

  // Wir iterieren durch die Daten, nicht durchs DOM -> schneller
  layoutData.areas.forEach(area => {
    area.tables.forEach(t => {
      const el = document.getElementById(`table-${t.id}`);
      const timerEl = document.getElementById(`timer-${t.id}`);
      if (!el || !timerEl) return;

      const s = getTableState(t.id);
      
      // Farbe update
      const newColor = getColor(s);
      if (el.style.backgroundColor !== newColor) {
        el.style.backgroundColor = newColor;
      }

      // Status für CSS Animationen (Pulse)
      if (el.dataset.status !== s.status) {
        el.dataset.status = s.status;
      }

      // Timer Text update
      let timerText = "";
      if (s.since && (s.status === "occupied" || s.status === "reminder")) {
        const mins = Math.floor((now - s.since) / 60000);
        timerText = `${mins} min`;
      } else if (s.status === "paid") {
         const mins = Math.floor((now - s.since) / 60000);
         timerText = `ok (${mins}m)`; // Optional: Zeigt wie lange schon bezahlt
      }
      
      // Nur schreiben wenn Änderung, spart Paint-Operationen
      if (timerEl.textContent !== timerText) {
        timerEl.textContent = timerText;
      }
    });
  });
}

function attachListeners(el, id) {
  let lastTap = 0;
  let longPressTimer = null;
  let isLongPress = false;
  let doubleTapTimer = null;

  // Rechtsklick (Desktop)
  el.addEventListener("contextmenu", e => {
    e.preventDefault();
    handleTransition(id, "hold");
  });

  // Touch / Maus Start
  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    isLongPress = false;
    
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      if(navigator.vibrate) navigator.vibrate(50);
      handleTransition(id, "hold");
    }, 600);
  });

  // Touch / Maus Ende
  el.addEventListener("pointerup", e => {
    if (e.button !== 0) return;
    clearTimeout(longPressTimer);

    if (isLongPress) return; 

    const now = Date.now();
    
    if (now - lastTap < 300) {
      // DOUBLE TAP
      clearTimeout(doubleTapTimer);
      handleTransition(id, "double");
      lastTap = 0;
    } else {
      // SINGLE TAP (WAIT)
      doubleTapTimer = setTimeout(() => {
        handleTransition(id, "single");
      }, 300);
      lastTap = now;
    }
  });
  
  // Verhindert Kontextmenü bei Longpress auf Mobile
  el.addEventListener("touchstart", e => {
     // Passive false wird benötigt wenn man preventDefault nutzen will, 
     // aber touch-action: manipulation regelt das meiste.
  }, {passive: true});
}

/* ================== INIT ================== */

// Einmaliger Aufbau
createLayout();

// Loop für Timer Updates (ruft updateVisuals auf)
setInterval(updateVisuals, 1000);