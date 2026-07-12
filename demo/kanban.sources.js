const Card = (id, title, col, type, priority, pts) => ({ id, title, col, type, priority, pts });

const Column = (id, label) => ({ id, label });

const TypeMeta = (id, icon) => ({ id, icon });

const PriorityMeta = (id, cls, label) => ({ id, cls, label });

let COLUMNS = [{id: "backlog", label: "Backlog"}, {id: "progress", label: "In Progress"}, {id: "review", label: "Review"}, {id: "done", label: "Done"}];
let CARDS = [{id: 1, title: "Procedural dungeon gen", col: "backlog", type: "code", priority: "high", pts: 8}, {id: 2, title: "Boss battle cutscene", col: "backlog", type: "art", priority: "medium", pts: 5}, {id: 3, title: "Leaderboard system", col: "backlog", type: "code", priority: "medium", pts: 4}, {id: 4, title: "Ambient sound pack", col: "backlog", type: "audio", priority: "low", pts: 3}, {id: 5, title: "Tutorial level design", col: "backlog", type: "design", priority: "high", pts: 6}, {id: 6, title: "Player movement physics", col: "progress", type: "code", priority: "critical", pts: 8}, {id: 7, title: "Main menu UI", col: "progress", type: "art", priority: "high", pts: 5}, {id: 8, title: "Synthwave OST", col: "progress", type: "audio", priority: "high", pts: 7}, {id: 9, title: "Level 2 tilemap", col: "progress", type: "design", priority: "medium", pts: 5}, {id: 10, title: "Inventory system", col: "review", type: "code", priority: "high", pts: 6}, {id: 11, title: "Character sprite sheet", col: "review", type: "art", priority: "medium", pts: 4}, {id: 12, title: "Save / load system", col: "review", type: "code", priority: "critical", pts: 7}, {id: 13, title: "Core game loop", col: "done", type: "code", priority: "critical", pts: 8}, {id: 14, title: "Title screen", col: "done", type: "art", priority: "high", pts: 5}, {id: 15, title: "SFX library", col: "done", type: "audio", priority: "medium", pts: 3}, {id: 16, title: "World map layout", col: "done", type: "design", priority: "high", pts: 6}];
let TYPE_META = [{id: "code", icon: "⚡"}, {id: "art", icon: "🎨"}, {id: "design", icon: "📐"}, {id: "audio", icon: "🎵"}];
let PRIORITY_META = [{id: "critical", cls: "crit", label: "Critical"}, {id: "high", cls: "high", label: "High"}, {id: "medium", cls: "med", label: "Medium"}, {id: "low", cls: "low", label: "Low"}];

const Board = (() => {
  let _state = { cards: CARDS, cols: COLUMNS, filter: "All", next_id: 17 };
  const _subs = [];
  return {
    get cards() { return _state.cards; },
    get cols() { return _state.cols; },
    get filter() { return _state.filter; },
    get next_id() { return _state.next_id; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

const type_icon = (() => {
  const __cache = new Map();
  return (t) => {
    const __key = JSON.stringify([t]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let hit = $find(TYPE_META, (m) => m.id == t);
      return hit ? hit.icon : "📋";
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const priority_cls = (() => {
  const __cache = new Map();
  return (p) => {
    const __key = JSON.stringify([p]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let hit = $find(PRIORITY_META, (m) => m.id == p);
      return hit ? hit.cls : "low";
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const priority_label = (() => {
  const __cache = new Map();
  return (p) => {
    const __key = JSON.stringify([p]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let hit = $find(PRIORITY_META, (m) => m.id == p);
      return hit ? hit.label : "Low";
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

/**
 * @param {string} col
 * @param {string} title
 * @param {string} type
 * @param {string} priority
 * @param {number} pts
 * @returns {*}
 */
const add_card = (col, title, type, priority, pts) => {
  let new_card = {id: Board.next_id, title, col, type, priority, pts};
  return Board.set({cards: [...Board.cards, new_card], next_id: Board.next_id + 1});
};

/**
 * @param {string} id
 * @param {string} label
 * @returns {*}
 */
const add_col = (id, label) => Board.set({cols: [...Board.cols, {id, label}]});

/**
 * @param {number} id
 * @returns {*}
 */
const remove_card = (id) => Board.set({cards: $filter(Board.cards, (c) => c.id != id)});

/**
 * @param {string} f
 * @returns {*}
 */
const set_filter = (f) => Board.set({filter: f});

const col_cards = (col) => $filter(Board.cards, (c) => c.col == col && (Board.filter == "All" || c.type == Board.filter));

/**
 * @param {Card} c
 * @returns {string}
 */
const render_card = (c) => {
  let icon = type_icon(c.type);
  let pcls = priority_cls(c.priority);
  let plbl = priority_label(c.priority);
  return `<div class="kcard type-${c.type}">
    <div class="kcard-head">
      <span class="kcard-icon">${icon}</span>
      <span class="kcard-badge ${pcls}">${plbl}</span>
    </div>
    <div class="kcard-title">${c.title}</div>
    <div class="kcard-foot">
      <span class="kcard-pts">${c.pts} pts</span>
      <div class="kcard-moves">
        <button class="mv-btn" title="Move left"  onclick="move_card_js(${c.id},-1)">‹</button>
        <button class="mv-btn mv-del" title="Remove" onclick="remove_card(${c.id})">✕</button>
        <button class="mv-btn" title="Move right" onclick="move_card_js(${c.id},1)">›</button>
      </div>
    </div>
  </div>`;
};

/**
 * @param {Column} col_obj
 * @returns {string}
 */
const render_lane = (col_obj) => {
  let col = col_obj.id;
  let label = col_obj.label;
  let cards = col_cards(col);
  let n = $count(cards);
  let pts = $sum_by(cards, (c) => c.pts);
  let html = $map(cards, (c) => render_card(c)).join("");
  let body = html == "" ? "<div class=\"empty-col\">— empty —</div>" : html;
  return `<div class="lane" data-col="${col}">
    <div class="lane-header">
      <h2 class="lane-title">${label} <span class="col-count">${n}</span></h2>
      <div class="lane-meta">
        <span class="lane-pts">${pts} pts</span>
        <button class="add-card-btn" title="Add card" onclick="showAddCard('${col}')">+</button>
      </div>
    </div>
    <div class="lane-cards">${body}</div>
  </div>`;
};

/**
 * @returns {number}
 */
const done_pct = () => {
  let done_n = $count($filter(Board.cards, (c) => c.col == "done"));
  let total_n = $count(Board.cards);
  return total_n > 0 ? $floor(done_n * 100 / total_n) : 0;
};

/**
 * @returns {*}
 */
const render = () => {
  document.getElementById("board").innerHTML = $map(Board.cols, (c) => render_lane(c)).join("");
  let pct = done_pct();
  document.getElementById("done-pct").textContent = `${pct}%`;
  return document.getElementById("prog-bar-fill").style.width = `${pct}%`;
};

Board.subscribe(() => (() => {
  render();
})());
