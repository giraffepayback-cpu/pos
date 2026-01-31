const layoutData = {
  areas: [
    {
      id: 'og',
      name: 'Obergeschoss',
      grid: { columns: 7, rows: 6 },
      tables: [
        { id: 1, x: 2, y: 1 }, { id: 2, x: 3, y: 1 }, { id: 3, x: 4, y: 1 }, { id: 4, x: 5, y: 1 },
        { id: 5, x: 1, y: 2 }, { id: 6, x: 1, y: 3 }, { id: 7, x: 1, y: 4 }, { id: 8, x: 1, y: 5 }, { id: 9, x: 1, y: 6 },
        { id: 10, x: 6, y: 2 }, { id: 11, x: 6, y: 3 }, { id: 12, x: 6, y: 4 }, { id: 13, x: 6, y: 5 }, { id: 14, x: 6, y: 6 }
      ]
    },
    {
      id: 'eg',
      name: 'Erdgeschoss',
      grid: { columns: 3, rows: 2 },
      tables: [
        { id: 21, x: 1, y: 1 }, { id: 22, x: 2, y: 1 }, { id: 23, x: 3, y: 1 },
        { id: 24, x: 1, y: 2 }, { id: 25, x: 2, y: 2 }, { id: 26, x: 3, y: 2 }
      ]
    },
    {
      id: 'terrasse',
      name: 'Terrasse',
      grid: { columns: 5, rows: 4 },
      tables: [
        { id: 101, x: 1, y: 1 }, { id: 102, x: 2, y: 1 }, { id: 103, x: 3, y: 1 },
        { id: 104, x: 4, y: 1 }, { id: 105, x: 5, y: 1 },
        { id: 106, x: 1, y: 3 }, { id: 107, x: 2, y: 3 }, { id: 108, x: 3, y: 3 },
        { id: 109, x: 4, y: 3 }, { id: 110, x: 5, y: 3 }
      ]
    }
  ]
};

const layoutEl = document.getElementById('layout');
const viewSelect = document.getElementById('viewSelect');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const backBtn = document.getElementById('backBtn');

const btnOccupied = document.getElementById('btnOccupied');
const btnFree = document.getElementById('btnFree');
const btnPaid = document.getElementById('btnPaid');

const STORAGE_KEY = 'pos-table-state';
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
let activeTableId = null;

/* ---------- helpers ---------- */

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTableState(id) {
  if (!state[id]) state[id] = { status: 'free', since: null };
  return state[id];
}

function getColor(s) {
  if (s.status === 'reminder') return 'var(--reminder)';
  if (s.status === 'paid') return 'var(--paid)';
  if (s.status === 'occupied') {
    const mins = (Date.now() - s.since) / 60000;
    if (mins >= 30) return 'var(--occupied-red)';
    if (mins >= 15) return 'var(--occupied-yellow)';
    return 'var(--occupied-green)';
  }
  return 'var(--free)';
}

/* ---------- render ---------- */

function render(view) {
  layoutEl.innerHTML = '';

  layoutData.areas
    .filter(a => view === 'all' || a.id === view)
    .forEach(area => {
      const section = document.createElement('section');
      section.className = 'area';

      const h2 = document.createElement('h2');
      h2.textContent = area.name;
      section.appendChild(h2);

      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.style.gridTemplateColumns = `repeat(${area.grid.columns}, 1fr)`;

      area.tables.forEach(t => {
        const s = getTableState(t.id);
        const el = document.createElement('div');

        el.className = 'table';
        el.style.gridColumn = t.x;
        el.style.gridRow = t.y;
        el.style.background = getColor(s);
        el.textContent = `Tisch ${t.id}`;

        let longPress;

        el.addEventListener('touchstart', () => {
          longPress = setTimeout(() => {
            s.status = 'reminder';
            saveState();
            render(viewSelect.value);
          }, 600);
        });

        el.addEventListener('touchend', () => clearTimeout(longPress));

        el.addEventListener('click', () => {
          activeTableId = t.id;
          overlayTitle.textContent = `Tisch ${t.id}`;
          overlay.style.display = 'block';
        });

        grid.appendChild(el);
      });

      section.appendChild(grid);
      layoutEl.appendChild(section);
    });
}

/* ---------- overlay ---------- */

backBtn.onclick = () => overlay.style.display = 'none';

btnOccupied.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = 'occupied';
  s.since = Date.now();
  saveState();
  overlay.style.display = 'none';
  render(viewSelect.value);
};

btnFree.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = 'free';
  s.since = null;
  saveState();
  overlay.style.display = 'none';
  render(viewSelect.value);
};

btnPaid.onclick = () => {
  const s = getTableState(activeTableId);
  s.status = 'paid';
  s.since = Date.now();
  saveState();
  overlay.style.display = 'none';
  render(viewSelect.value);
};

/* ---------- init ---------- */

layoutData.areas.forEach(a => {
  const opt = document.createElement('option');
  opt.value = a.id;
  opt.textContent = a.name;
  viewSelect.appendChild(opt);
});

viewSelect.onchange = e => render(e.target.value);

setInterval(() => render(viewSelect.value), 30000);
render('all');