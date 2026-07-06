

/** @typedef {{
 *   all_items: Item[],
 *   cart: Item[],
 *   filter_cat: string,
 *   filter_rar: string,
 *   sort_key: string,
 *   search: string
 * }} AppState
 */
const AppState = (all_items, cart, filter_cat, filter_rar, sort_key, search) => ({ all_items, cart, filter_cat, filter_rar, sort_key, search });

const make_state = () => ({
  all_items: get_catalog(),
  cart: [],
  filter_cat: "All",
  filter_rar: "All",
  sort_key: "price_asc",
  search: ""
});

/**
 * @param {AppState} state
 * @returns {Item[]}
 */
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

/**
 * @param {AppState} state
 * @returns {void}
 */
const render = (state) => {
  let visible = apply_filters(state);
  render_grid(state, visible);
  render_cart(state);
  return render_stats(state, visible);
};

/**
 * @param {AppState} state
 * @param {Item[]} visible
 * @returns {void}
 */
const render_stats = (state, visible) => {
  el("result-count").textContent = visible.length + " items";
  el("cart-total").textContent = cart_total(state.cart) + "g";
  return el("cart-count").textContent = state.cart.length + "";
};

/**
 * @param {AppState} state
 * @param {Item[]} items
 * @returns {void}
 */
const render_grid = (state, items) => {
  if (items.length == 0) {
    return el("item-grid").innerHTML = "<div class=\"empty-state\">No items match your search.</div>";
  } else {
    let cards = transform(items, item => item_card_html(state, item));
    return el("item-grid").innerHTML = cards.join("");
  }
};

/**
 * @param {AppState} state
 * @param {Item} item
 * @returns {string}
 */
const item_card_html = (state, item) => {
  let color = rarity_color(item.rarity);
  let icon = category_icon(item.category);
  let in_cart = is_in_cart(state, item);
  let btn_cls = in_cart ? "btn-in-cart" : "btn-buy";
  let btn_txt = in_cart ? "✓ In Cart" : "Add to Cart";
  let badge = "<span class=\"rarity-badge\" style=\"color:" + color + ";border-color:" + color + "\">" + item.rarity + "</span>";
  return "<div class=\"item-card\">" + "<div class=\"item-header\">" + "<span class=\"item-icon\">" + icon + "</span>" + "<div class=\"item-title\">" + "<div class=\"item-name\">" + item.name + "</div>" + badge + "</div>" + "</div>" + "<div class=\"item-lore\">" + item.lore + "</div>" + "<div class=\"item-footer\">" + "<div class=\"item-stats\">" + "<span class=\"stat-price\">💰 " + item.price + "g</span>" + "<span class=\"stat-power\">⚡ " + item.power + "</span>" + "</div>" + "<button class=\"" + btn_cls + "\" onclick=\"bazaarBuy('" + item.name + "')\">" + btn_txt + "</button>" + "</div>" + "</div>";
};

/**
 * @param {AppState} state
 * @returns {void}
 */
const render_cart = (state) => {
  if (state.cart.length == 0) {
    return el("cart-items").innerHTML = "<div class=\"cart-empty\">Your cart is empty.</div>";
  } else {
    let rows = transform(state.cart, item => "<div class=\"cart-row\">" + "<span class=\"cart-item-name\">" + category_icon(item.category) + " " + item.name + "</span>" + "<span class=\"cart-item-price\">" + item.price + "g</span>" + "<button class=\"cart-remove\" onclick=\"bazaarRemove('" + item.name + "')\">✕</button>" + "</div>");
    return el("cart-items").innerHTML = rows.join("");
  }
};

let state = make_state();

/**
 * @param {string} name
 * @returns {void}
 */
const buy_item = (name) => {
  let item_arr = synth_filter(state.all_items, i => i.name == name);
  if (item_arr.length > 0) {
    let item = item_arr[0];
    if (is_in_cart(state, item)) {
      state = {
  all_items: state.all_items,
  cart: synth_filter(state.cart, c => c.name != name),
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

/**
 * @param {string} name
 * @returns {void}
 */
const remove_item = (name) => {
  state = {
  all_items: state.all_items,
  cart: synth_filter(state.cart, c => c.name != name),
  filter_cat: state.filter_cat,
  filter_rar: state.filter_rar,
  sort_key: state.sort_key,
  search: state.search
};
  return render(state);
};

/**
 * @returns {void}
 */
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

/**
 * @returns {void}
 */
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

