

const $map = (xs, fn) => xs.map(fn);
const $filter = (xs, pred) => xs.filter(pred);
const $fold = (xs, init, fn) => xs.reduce(fn, init);
const $pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const $zip = (xs, ys) => xs.map((x, i) => [x, ys[i]]);
const $range = (start, end) => Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
const $first = (xs) => xs[0];
const $last = (xs) => xs[xs.length - 1];
const $sum = (xs) => xs.reduce((a, b) => a + b, 0);
const $count = (xs, pred) => pred ? xs.filter(pred).length : xs.length;
const $any = (xs, pred) => xs.some(pred);
const $all = (xs, pred) => xs.every(pred);
const $flat = (xs) => xs.flat();
const $groupBy = (xs, keyFn) => xs.reduce((m, x) => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); return m; }, new Map());
const $pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const $omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const $sort_by = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
const $sort_by_desc = (xs, keyFn) => [...xs].sort((a, b) => { const ka = keyFn(a), kb = keyFn(b); return ka > kb ? -1 : ka < kb ? 1 : 0; });
const $trim = (s) => s.trim();
const $split = (s, sep) => s.split(sep);
const $starts_with = (s, prefix) => s.startsWith(prefix);
const $ends_with = (s, suffix) => s.endsWith(suffix);
const $contains = (s, sub) => s.includes(sub);
const $to_upper = (s) => s.toUpperCase();
const $to_lower = (s) => s.toLowerCase();
const $replace_all = (s, from, to) => s.replaceAll(from, to);
const $pad_start = (s, len, padChar = ' ') => s.padStart(len, padChar);
const $pad_end = (s, len, padChar = ' ') => s.padEnd(len, padChar);
const $min = (xs) => xs.reduce((a, b) => a < b ? a : b);
const $max = (xs) => xs.reduce((a, b) => a > b ? a : b);
const $min_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) <= keyFn(b) ? a : b);
const $max_by = (xs, keyFn) => xs.reduce((a, b) => keyFn(a) >= keyFn(b) ? a : b);
const $take = (xs, n) => xs.slice(0, n);
const $drop = (xs, n) => xs.slice(n);
const $uniq = (xs) => [...new Set(xs)];
const $chunk = (xs, n) => { const out = []; for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n)); return out; };
const $flat_map = (xs, fn) => xs.flatMap(fn);
const $set_at = (xs, i, val) => [...xs.slice(0, i), val, ...xs.slice(i + 1)];
const $reverse = (xs) => [...xs].reverse();
const $sum_by = (xs, keyFn) => xs.reduce((acc, x) => acc + keyFn(x), 0);
const $clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const $abs = (x) => Math.abs(x);
const $round = (x) => Math.round(x);
const $floor = (x) => Math.floor(x);
const $ceil = (x) => Math.ceil(x);
const $pow = (x, exp) => Math.pow(x, exp);
const $sqrt = (x) => Math.sqrt(x);
const $random = () => Math.random();
const $random_int = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const __synth_presets = {
  email:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url:     /^https?:\/\//,
  uuid:    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alpha:   /^[a-zA-Z]+$/,
  alnum:   /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  slug:    /^[a-z0-9-]+$/,
  hex:     /^#?[0-9a-fA-F]{3,8}$/,
};
const $ok = (value) => ({ tag: 'Ok', value });
const $err = (message) => ({ tag: 'Err', message });
const $is_ok = (r) => r != null && r.tag === 'Ok';
const $is_err = (r) => r != null && r.tag === 'Err';
const $unwrap = (r) => { if (r != null && r.tag === 'Ok') return r.value; throw new Error(r != null ? r.message : 'unwrap called on null'); };
const $unwrap_or = (r, fallback) => (r != null && r.tag === 'Ok') ? r.value : fallback;
const $delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const $println = (...args) => { console.log(...args); console.log(''); };
const __synth_tests = [];
const __runSynthTests = () => {
  let passed = 0, failed = 0;
  const results = [];
  for (const t of __synth_tests) {
    try {
      const isOk = !!t.fn();
      if (isOk) { passed++; results.push({ ok: true, desc: t.desc }); }
      else { failed++; results.push({ ok: false, desc: t.desc, error: 'assertion returned false' }); }
    } catch(e) { failed++; results.push({ ok: false, desc: t.desc, error: String(e) }); }
  }
  return { passed, failed, total: passed + failed, results };
};
if (typeof globalThis !== 'undefined') { globalThis.__synth_tests = __synth_tests; globalThis.__runSynthTests = __runSynthTests; }
const Weapon = Object.freeze({ tag: "Weapon" });
const Armor = Object.freeze({ tag: "Armor" });
const Potion = Object.freeze({ tag: "Potion" });
const Relic = Object.freeze({ tag: "Relic" });
const Scroll = Object.freeze({ tag: "Scroll" });
const Item = (name, category, rarity, price, power, lore) => ({ name, category, rarity, price, power, lore });
const keep_if = (items, pred) => $filter(items, pred);
const transform = (items, f) => $map(items, f);
const order_by = (items, key) => items.slice().sort((a, b) => {
  let ka = key(a);
  let kb = key(b);
  if (ka < kb) {
    return -1;
  } else if (ka > kb) {
    return 1;
  } else {
    return 0;
  }
});
const order_by_desc = (items, key) => items.slice().sort((a, b) => {
  let ka = key(a);
  let kb = key(b);
  if (ka > kb) {
    return -1;
  } else if (ka < kb) {
    return 1;
  } else {
    return 0;
  }
});
const total = (items, value_of) => {
  let acc = 0;
  for (const item of items) {
    acc = acc + value_of(item);
  }
  return acc;
};
const rarity_rank = (r) => ((_m) => (_m === "Common") ? 1 : (_m === "Uncommon") ? 2 : (_m === "Rare") ? 3 : (_m === "Epic") ? 4 : (_m === "Legendary") ? 5 : 0)(r);
const rarity_color = (r) => ((_m) => (_m === "Common") ? "#aaaaaa" : (_m === "Uncommon") ? "#1eff00" : (_m === "Rare") ? "#0070dd" : (_m === "Epic") ? "#a335ee" : (_m === "Legendary") ? "#ff8000" : "#ffffff")(r);
const category_icon = (c) => ((_m) => (_m.tag === "Weapon") ? "⚔️" : (_m.tag === "Armor") ? "🛡️" : (_m.tag === "Potion") ? "⚗️" : (_m.tag === "Relic") ? "💎" : (_m.tag === "Scroll") ? "📜" : undefined)(c);
const category_name = (c) => ((_m) => (_m.tag === "Weapon") ? "Weapon" : (_m.tag === "Armor") ? "Armor" : (_m.tag === "Potion") ? "Potion" : (_m.tag === "Relic") ? "Relic" : (_m.tag === "Scroll") ? "Scroll" : undefined)(c);
const by_category = (items, cat) => {
  if (cat == "All") {
    return items;
  } else {
    return $filter(items, item => category_name(item.category) == cat);
  }
};
const by_rarity = (items, rar) => {
  if (rar == "All") {
    return items;
  } else {
    return $filter(items, item => item.rarity == rar);
  }
};
const by_max_price = (items, max) => {
  if ($max <= 0) {
    return items;
  } else {
    return $filter(items, item => item.price <= $max);
  }
};
const search_items = (items, query) => {
  if (query == "") {
    return items;
  } else {
    let q = query.toLowerCase();
    return $filter(items, item => item.name.toLowerCase().includes(q) || item.lore.toLowerCase().includes(q));
  }
};
const describe_item = (item) => category_icon(item.category) + " " + item.name + " [" + item.rarity + "] — " + item.price + "g";
const cart_total = (items) => total(items, item => item.price);
__synth_tests.push({ desc: "rarity_rank orders correctly", fn: () => rarity_rank("Legendary") > rarity_rank("Common") });
__synth_tests.push({ desc: "rarity_rank unknown returns 0", fn: () => rarity_rank("Mythic") == 0 });
__synth_tests.push({ desc: "category_icon returns emoji", fn: () => category_icon(Weapon) == "⚔️" });
__synth_tests.push({ desc: "category_name returns string", fn: () => category_name(Potion) == "Potion" });
__synth_tests.push({ desc: "keep_if filters by predicate", fn: () => keep_if([1, 2, 3, 4], x => x > 2).length == 2 });
__synth_tests.push({ desc: "transform applies function", fn: () => transform([1, 2, 3], x => x * 2)[2] == 6 });
__synth_tests.push({ desc: "order_by sorts ascending", fn: () => order_by([3, 1, 2], x => x)[0] == 1 });
__synth_tests.push({ desc: "order_by_desc sorts descending", fn: () => order_by_desc([3, 1, 2], x => x)[0] == 3 });
__synth_tests.push({ desc: "total sums values", fn: () => total([1, 2, 3], x => x) == 6 });
__synth_tests.push({ desc: "let infer on item transform", fn: () => (() => {
  let names = transform([{ name: "Sword" }, { name: "Bow" }], i => i.name);
  return names[0] == "Sword";
})() });
__synth_tests.push({ desc: "by_category All returns all", fn: () => by_category([{ name: "x", category: Weapon, rarity: "Common", price: 10, power: 5, lore: "" }], "All").length == 1 });
__synth_tests.push({ desc: "search_items finds by name", fn: () => (() => {
  let items = [{
  name: "Iron Sword",
  category: Weapon,
  rarity: "Common",
  price: 40,
  power: 12,
  lore: "reliable"
}];
  return search_items(items, "sword").length == 1;
})() });
__synth_tests.push({ desc: "search_items empty query returns all", fn: () => (() => {
  let items = [{
  name: "Iron Sword",
  category: Weapon,
  rarity: "Common",
  price: 40,
  power: 12,
  lore: ""
}];
  return search_items(items, "").length == 1;
})() });
__synth_tests.push({ desc: "cart_total sums item prices", fn: () => cart_total([{
  name: "A",
  category: Weapon,
  rarity: "Common",
  price: 100,
  power: 10,
  lore: ""
}, { name: "B", category: Potion, rarity: "Common", price: 50, power: 5, lore: "" }]) == 150 });

const get_catalog = () => [{
  name: "Iron Sword",
  category: Weapon,
  rarity: "Common",
  price: 40,
  power: 12,
  lore: "A standard blade, well-worn but reliable."
}, {
  name: "Serpent Fang",
  category: Weapon,
  rarity: "Uncommon",
  price: 120,
  power: 28,
  lore: "Said to carry a venom that slows the mind."
}, {
  name: "Stormcaller Axe",
  category: Weapon,
  rarity: "Rare",
  price: 380,
  power: 55,
  lore: "Crackling with static, it calls lightning on a crit."
}, {
  name: "Dawnbreaker",
  category: Weapon,
  rarity: "Epic",
  price: 950,
  power: 88,
  lore: "Forged at first light, it burns undead on contact."
}, {
  name: "Worldender",
  category: Weapon,
  rarity: "Legendary",
  price: 4200,
  power: 140,
  lore: "No chronicle speaks of who first unsheathed it."
}, {
  name: "Leather Vest",
  category: Armor,
  rarity: "Common",
  price: 35,
  power: 8,
  lore: "Light and breathable. Smells faintly of mead."
}, {
  name: "Chain Hauberk",
  category: Armor,
  rarity: "Uncommon",
  price: 110,
  power: 22,
  lore: "Rattles on stairs. Very effective, very loud."
}, {
  name: "Shadowweave Cloak",
  category: Armor,
  rarity: "Rare",
  price: 420,
  power: 40,
  lore: "Absorbs faint light. Rogues pay triple for these."
}, {
  name: "Aegis of the Fallen",
  category: Armor,
  rarity: "Epic",
  price: 1100,
  power: 75,
  lore: "Carved with the names of the seven lost kingdoms."
}, {
  name: "Minor Healing",
  category: Potion,
  rarity: "Common",
  price: 15,
  power: 20,
  lore: "Tastes of copper. Works on most wounds."
}, {
  name: "Swiftfoot Draught",
  category: Potion,
  rarity: "Uncommon",
  price: 55,
  power: 0,
  lore: "Doubles movement speed for one hour. Side-effects: hiccups."
}, {
  name: "Greater Elixir",
  category: Potion,
  rarity: "Rare",
  price: 200,
  power: 60,
  lore: "Used by healers who have run out of spells."
}, {
  name: "Phoenix Tears",
  category: Potion,
  rarity: "Legendary",
  price: 2800,
  power: 999,
  lore: "Said to pull souls back from the other shore."
}, {
  name: "Lucky Coin",
  category: Relic,
  rarity: "Common",
  price: 60,
  power: 5,
  lore: "Warm to the touch. Never lands on tails."
}, {
  name: "Whispering Orb",
  category: Relic,
  rarity: "Uncommon",
  price: 150,
  power: 18,
  lore: "Murmurs weather forecasts in an unknown language."
}, {
  name: "Eye of Eternity",
  category: Relic,
  rarity: "Epic",
  price: 1500,
  power: 65,
  lore: "Grants true sight. The price is one real eye."
}, {
  name: "Shard of the Abyss",
  category: Relic,
  rarity: "Legendary",
  price: 5000,
  power: 200,
  lore: "Cold. Always cold. Even in fire."
}, {
  name: "Torch Scroll",
  category: Scroll,
  rarity: "Common",
  price: 20,
  power: 10,
  lore: "Casts a small light. Very popular in dungeons."
}, {
  name: "Scroll of Binding",
  category: Scroll,
  rarity: "Uncommon",
  price: 90,
  power: 30,
  lore: "Roots an enemy in place for three breaths."
}, {
  name: "Tome of Unmaking",
  category: Scroll,
  rarity: "Rare",
  price: 500,
  power: 70,
  lore: "Erases one object from history. One use only."
}];

const AppState = (all_items, cart, filter_cat, filter_rar, sort_key, search) => ({ all_items, cart, filter_cat, filter_rar, sort_key, search });
const make_state = () => ({
  all_items: get_catalog(),
  cart: [],
  filter_cat: "All",
  filter_rar: "All",
  sort_key: "price_asc",
  search: ""
});
const apply_filters = (state) => {
  let items = state.all_items;
  let a = by_category(items, state.filter_cat);
  let b = by_rarity(a, state.filter_rar);
  let c = search_items(b, state.search);
  let sorted = apply_sort(c, state.sort_key);
  return sorted;
};
const apply_sort = (items, sort) => ((_m) => (_m === "price_asc") ? order_by(items, i => i.price) : (_m === "price_desc") ? order_by_desc(items, i => i.price) : (_m === "power_desc") ? order_by_desc(items, i => i.power) : (_m === "rarity_desc") ? order_by_desc(items, i => rarity_rank(i.rarity)) : (_m === "name_asc") ? order_by(items, i => i.name) : items)(sort);
const is_in_cart = (state, item) => state.cart.some(c => c.name == item.name);
const el = (id) => document.getElementById(id);
const set_count = (id, n) => el(id).textContent = n + "";
const render = (state) => {
  let visible = apply_filters(state);
  render_grid(state, visible);
  render_cart(state);
  return render_stats(state, visible);
};
const render_stats = (state, visible) => {
  el("result-count").textContent = visible.length + " items";
  el("cart-total").textContent = cart_total(state.cart) + "g";
  return el("cart-count").textContent = state.cart.length + "";
};
const render_grid = (state, items) => {
  if (items.length == 0) {
    return el("item-grid").innerHTML = "<div class=\"empty-state\">No items match your search.</div>";
  } else {
    let cards = transform(items, item => item_card_html(state, item));
    return el("item-grid").innerHTML = cards.join("");
  }
};
const item_card_html = (state, item) => {
  let color = rarity_color(item.rarity);
  let icon = category_icon(item.category);
  let in_cart = is_in_cart(state, item);
  let btn_cls = in_cart ? "btn-in-cart" : "btn-buy";
  let btn_txt = in_cart ? "✓ In Cart" : "Add to Cart";
  let badge = "<span class=\"rarity-badge\" style=\"color:" + color + ";border-color:" + color + "\">" + item.rarity + "</span>";
  return "<div class=\"item-card\">" + "<div class=\"item-header\">" + "<span class=\"item-icon\">" + icon + "</span>" + "<div class=\"item-title\">" + "<div class=\"item-name\">" + item.name + "</div>" + badge + "</div>" + "</div>" + "<div class=\"item-lore\">" + item.lore + "</div>" + "<div class=\"item-footer\">" + "<div class=\"item-stats\">" + "<span class=\"stat-price\">💰 " + item.price + "g</span>" + "<span class=\"stat-power\">⚡ " + item.power + "</span>" + "</div>" + "<button class=\"" + btn_cls + "\" onclick=\"bazaarBuy('" + item.name + "')\">" + btn_txt + "</button>" + "</div>" + "</div>";
};
const render_cart = (state) => {
  if (state.cart.length == 0) {
    return el("cart-items").innerHTML = "<div class=\"cart-empty\">Your cart is empty.</div>";
  } else {
    let rows = transform(state.cart, item => "<div class=\"cart-row\">" + "<span class=\"cart-item-name\">" + category_icon(item.category) + " " + item.name + "</span>" + "<span class=\"cart-item-price\">" + item.price + "g</span>" + "<button class=\"cart-remove\" onclick=\"bazaarRemove('" + item.name + "')\">✕</button>" + "</div>");
    return el("cart-items").innerHTML = rows.join("");
  }
};
let state = make_state();
const buy_item = (name) => {
  let item_arr = $filter(state.all_items, i => i.name == name);
  if (item_arr.length > 0) {
    let item = item_arr[0];
    if (is_in_cart(state, item)) {
      state = {
  all_items: state.all_items,
  cart: $filter(state.cart, c => c.name != name),
  filter_cat: state.filter_cat,
  filter_rar: state.filter_rar,
  sort_key: state.sort_key,
  search: state.search
};
    } else {
      state = {
  all_items: state.all_items,
  cart: state.cart.concat([item]),
  filter_cat: state.filter_cat,
  filter_rar: state.filter_rar,
  sort_key: state.sort_key,
  search: state.search
};
    }
    return render(state);
  }
};
const remove_item = (name) => {
  state = {
  all_items: state.all_items,
  cart: $filter(state.cart, c => c.name != name),
  filter_cat: state.filter_cat,
  filter_rar: state.filter_rar,
  sort_key: state.sort_key,
  search: state.search
};
  return render(state);
};
const on_filter_change = () => {
  let cat = el("filter-cat").value;
  let rar = el("filter-rar").value;
  let srt = el("sort-select").value;
  let q = el("search-box").value;
  state = {
  all_items: state.all_items,
  cart: state.cart,
  filter_cat: cat,
  filter_rar: rar,
  sort_key: srt,
  search: q
};
  return render(state);
};
const clear_cart = () => {
  state = {
  all_items: state.all_items,
  cart: [],
  filter_cat: state.filter_cat,
  filter_rar: state.filter_rar,
  sort_key: state.sort_key,
  search: state.search
};
  return render(state);
};
window.bazaarBuy = buy_item;
window.bazaarRemove = remove_item;
window.onFilterChange = on_filter_change;
window.clearCart = clear_cart;
render(state);
