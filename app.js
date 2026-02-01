/* ================== DATA ================== */

let layoutData = {
  "areas": [
    {
      "id": "og",
      "name": "Obergeschoss",
      "grid": {"columns": 5, "rows": 8},
      "tables": [
        {"id": 101, "x": 4, "y": 4}, {"id": 102, "x": 5, "y": 5}, {"id": 103, "x": 5, "y": 3}, {"id": 104, "x": 5, "y": 2},
        {"id": 105, "x": 5, "y": 1}, {"id": 106, "x": 4, "y": 1}, {"id": 107, "x": 3, "y": 2}, {"id": 108, "x": 2, "y": 1}, {"id": 109, "x": 1, "y": 1},
        {"id": 110, "x": 1, "y": 2}, {"id": 111, "x": 1, "y": 3}, {"id": 112, "x": 1, "y": 5}, {"id": 113, "x": 2, "y": 4}, {"id": 114, "x": 1, "y": 6},
	{"id": 115, "x": 1, "y": 7}, {"id": 116, "x": 1, "y": 8}
      ]
    },
    {
      "id": "eg",
      "name": "Erdgeschoss",
      "grid": {"columns": 7, "rows": 3},
      "tables": [
        {"id": 1, "x": 1, "y": 3}, {"id": 2, "x": 1, "y": 1}, {"id": 3, "x": 3, "y": 1},
        {"id": 4, "x": 5, "y": 1}, {"id": 5, "x": 7, "y": 1}, {"id": 6, "x": 7, "y": 3},
	{"id": 7, "x": 4, "y": 3}
      ]
    },
    {
      "id": "terrasse",
      "name": "Terrasse",
      "grid": {"columns": 7, "rows": 1},
      "tables": [
        {"id": 27, "x": 1, "y": 1}, {"id": 28, "x": 2, "y": 1}, {"id": 29, "x": 3, "y": 1},
	{"id": 20, "x": 5, "y": 1}, {"id": 21, "x": 6, "y": 1}, {"id": 22, "x": 7, "y": 1},
      ]
    }
  ]
}};

/* ================== DOM ================== */

const layoutEl = document.getElementById("layout");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const backBtn = document.getElementById("backBtn");
const btnOccupied = document.getElementById("btnOccupied");
const btnFree = document.getElementById("btnFree");
const btnPaid = document.getElementById("btnPaid");

const contextMenu = document.getElementById("contextMenu");
const ctxTitle = document.getElementById("ctxTitle");
const ctxMove = document.getElementById("ctxMove");
const ctxServed = document.getElementById("ctxServed");
const ctxReminder = document.getElementById("ctxReminder");

/* ================== STATE ================== */

const STORAGE_KEY = "pos-state";
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let activeTableId = null;
let contextTableId = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTableState(id) {
  if (!state[id]) state[id] = { status: "free", since: null };
  return state[id];
}

/* ================== COLOR ================== */

function getColor(s) {
  if (s.status === "reminder") return "#9b59b6";
  if (s.status === "paid") return "#aaa";
  if (s.status === "occupied") {
    const mins = (Date.now() - s.since) / 60000;
    if (mins >= 30) return "#e74c3c";
    if (mins >= 15) return "#f1c40f";
    return "#2ecc71";
  }
  return "#666";
}

/* ================== RENDER ================== */

function render() {
  layoutEl.innerHTML = "";

  layoutData.areas.forEach(area => {
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.gridTemplateColumns = `repeat(${area.grid.columns},1fr)`;

    area.tables.forEach(t => {
      const s = getTableState(t.id);
      const el = document.createElement("div");
      el.className = "table";
      el.style.gridColumn = t.x;
      el.style.gridRow = t.y;
      el.style.background = getColor(s);
      el.textContent = `Tisch ${t.id}`;

      const timer = document.createElement("small");
      el.appendChild(timer);

      /* ====== INTERACTION LOGIC ====== */

      let downTime = 0;
      let lastTap = 0;
      let longPressTimer = null;
      let longPressTriggered = false;

      el.addEventListener("pointerdown", e => {
        downTime = Date.now();
        longPressTriggered = false;

        if (e.pointerType === "touch") {
          longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            openContextMenu(t.id, el);
          }, 600);
        }
      });

      el.addEventListener("pointerup", e => {
        clearTimeout(longPressTimer);

        if (longPressTriggered) return;

        const now = Date.now();

        if (now - lastTap < 300) {
          // DOUBLE TAP
          s.status = "reminder";
          s.since = s.since || Date.now();
          saveState();
          render();
        } else {
          // SINGLE TAP (delayed)
          setTimeout(() => {
            if (Date.now() - lastTap >= 300) {
              activeTableId = t.id;
              overlayTitle.textContent = `Tisch ${t.id}`;
              overlay.style.display = "block";
            }
          }, 300);
        }

        lastTap = now;
      });

      el.addEventListener("contextmenu", e => {
        e.preventDefault();
        openContextMenu(t.id, el);
      });

      grid.appendChild(el);
    });

    layoutEl.appendChild(grid);
  });
}

/* ================== CONTEXT MENU ================== */

function openContextMenu(id, el) {
  contextTableId = id;
  const rect = el.getBoundingClientRect();
  contextMenu.style.top = `${rect.bottom + window.scrollY}px`;
  contextMenu.style.left = `${rect.left + window.scrollX}px`;
  ctxTitle.textContent = `Tisch ${id}`;
  contextMenu.style.display = "block";
}

document.addEventListener("pointerdown", e => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.style.display = "none";
  }
});

ctxServed.onclick = () => {
  const s = getTableState(contextTableId);
  s.status = "occupied";
  s.since = Date.now();
  saveState();
  contextMenu.style.display = "none";
  render();
};

ctxReminder.onclick = () => {
  const text = prompt("Erinnerung (optional)");
  const s = getTableState(contextTableId);
  s.status = "reminder";
  s.since = s.since || Date.now();
  if (text) s.note = text;
  saveState();
  contextMenu.style.display = "none";
  render();
};

ctxMove.onclick = () => {
  prompt("Ziel-Tisch (noch ohne Funktion)");
  contextMenu.style.display = "none";
};

/* ================== OVERLAY ================== */

backBtn.onclick = () => overlay.style.display = "none";

btnOccupied.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = "occupied";
  s.since = Date.now();
  saveState();
  overlay.style.display = "none";
  render();
};

btnFree.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = "free";
  s.since = null;
  saveState();
  overlay.style.display = "none";
  render();
};

btnPaid.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = "paid";
  s.since = Date.now();
  saveState();
  overlay.style.display = "none";
  render();
};

/* ================== TIMER ================== */

setInterval(() => {
  document.querySelectorAll(".table").forEach(el => {
    const id = parseInt(el.textContent.replace("Tisch ", ""));
    const s = getTableState(id);
    const timer = el.querySelector("small");

    if (s.since) {
      const mins = Math.floor((Date.now() - s.since) / 60000);
      timer.textContent = `${mins} min`;
    } else {
      timer.textContent = "";
    }
  });
}, 1000);

/* ================== INIT ================== */

render();
