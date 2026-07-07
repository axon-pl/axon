const Card = (id, title, col, type, priority, pts) => ({ id, title, col, type, priority, pts });
const Column = (id, label) => ({ id, label });
let initial_cols = [{ id: "backlog", label: "Backlog" }, { id: "progress", label: "In Progress" }, { id: "review", label: "Review" }, { id: "done", label: "Done" }];
let initial_cards = [{
  id: 1,
  title: "Procedural dungeon gen",
  col: "backlog",
  type: "code",
  priority: "high",
  pts: 8
}, {
  id: 2,
  title: "Boss battle cutscene",
  col: "backlog",
  type: "art",
  priority: "medium",
  pts: 5
}, {
  id: 3,
  title: "Leaderboard system",
  col: "backlog",
  type: "code",
  priority: "medium",
  pts: 4
}, {
  id: 4,
  title: "Ambient sound pack",
  col: "backlog",
  type: "audio",
  priority: "low",
  pts: 3
}, {
  id: 5,
  title: "Tutorial level design",
  col: "backlog",
  type: "design",
  priority: "high",
  pts: 6
}, {
  id: 6,
  title: "Player movement physics",
  col: "progress",
  type: "code",
  priority: "critical",
  pts: 8
}, {
  id: 7,
  title: "Main menu UI",
  col: "progress",
  type: "art",
  priority: "high",
  pts: 5
}, {
  id: 8,
  title: "Synthwave OST",
  col: "progress",
  type: "audio",
  priority: "high",
  pts: 7
}, {
  id: 9,
  title: "Level 2 tilemap",
  col: "progress",
  type: "design",
  priority: "medium",
  pts: 5
}, {
  id: 10,
  title: "Inventory system",
  col: "review",
  type: "code",
  priority: "high",
  pts: 6
}, {
  id: 11,
  title: "Character sprite sheet",
  col: "review",
  type: "art",
  priority: "medium",
  pts: 4
}, {
  id: 12,
  title: "Save / load system",
  col: "review",
  type: "code",
  priority: "critical",
  pts: 7
}, {
  id: 13,
  title: "Core game loop",
  col: "done",
  type: "code",
  priority: "critical",
  pts: 8
}, {
  id: 14,
  title: "Title screen",
  col: "done",
  type: "art",
  priority: "high",
  pts: 5
}, {
  id: 15,
  title: "SFX library",
  col: "done",
  type: "audio",
  priority: "medium",
  pts: 3
}, {
  id: 16,
  title: "World map layout",
  col: "done",
  type: "design",
  priority: "high",
  pts: 6
}];
const Board = (() => {
  let _state = { cards: initial_cards, cols: initial_cols, filter: "All", next_id: 17 };
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
const type_icon = (t) => ((_m) => (_m === "code") ? "⚡" : (_m === "art") ? "🎨" : (_m === "design") ? "📐" : (_m === "audio") ? "🎵" : "📋")(t);
const priority_cls = (p) => ((_m) => (_m === "critical") ? "crit" : (_m === "high") ? "high" : (_m === "medium") ? "med" : "low")(p);
const priority_label = (p) => ((_m) => (_m === "critical") ? "Critical" : (_m === "high") ? "High" : (_m === "medium") ? "Medium" : "Low")(p);
const add_card = (col, title, kind, priority, pts) => {
  let new_card = { id: Board.next_id, title, col, type: kind, priority, pts };
  return Board.set({ cards: [...Board.cards, new_card], next_id: Board.next_id + 1 });
};
const add_col = (id, label) => {
  let new_col = { id, label };
  return Board.set({ cols: [...Board.cols, new_col] });
};
const remove_card = (id) => Board.set({ cards: $filter(Board.cards, c => c.id != id) });
const set_filter = (f) => Board.set({ filter: f });
const type_matches = (c) => Board.filter == "All" || c.type == Board.filter;
const col_cards = (col) => $filter(Board.cards, c => c.col == col && type_matches(c));
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
const render_lane = (col_obj) => {
  let col = col_obj.id;
  let label = col_obj.label;
  let cards = col_cards(col);
  let n = $count(cards);
  let pts = $sum_by(cards, c => c.pts);
  let parts = $map(cards, c => render_card(c));
  let html = parts.join("");
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
const render = () => {
  let lane_parts = $map(Board.cols, c => render_lane(c));
  let lanes_html = lane_parts.join("");
  document.getElementById("board").innerHTML = lanes_html;
  let done_cards = $filter(Board.cards, c => c.col == "done");
  let done_n = $count(done_cards);
  let total_n = $count(Board.cards);
  let pct = total_n > 0 ? $floor(done_n * 100 / total_n) : 0;
  document.getElementById("done-pct").textContent = pct + "%";
  return document.getElementById("prog-bar-fill").style.width = pct + "%";
};
Board.subscribe(() => {
  render();
});
