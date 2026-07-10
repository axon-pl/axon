/** @param {number} v @returns {boolean} */
const __validate_BPM = (v) => (v >= 60) && (v <= 200);
/** @param {number} v @returns {boolean} */
const __validate_Duration = (v) => v > 0;
/** @param {string} v @returns {boolean} */
const __validate_TrackTitle = (v) => v.length > 0;
/** @param {string} v @returns {boolean} */
const __validate_ArtistName = (v) => v.length > 0;
/** @param {number} v @returns {boolean} */
const __validate_Volume = (v) => (v >= 0) && (v <= 100);

const Track = (id, title, artist, bpm, duration, genre, featured) => ({ id, title, artist, bpm, duration, genre, featured });

const LibraryStats = (count, totalDuration, avgBpm, featuredCount) => ({ count, totalDuration, avgBpm, featuredCount });

const track_is_featured = (t) => t.featured;

const pad2 = (n) => n < 10 ? "0" + String(n) : String(n);

const format_track_label = (t) => `${t.title} · ${t.artist}`;

const format_bpm_tag = (bpm) => `${bpm} BPM`;

const format_fibonacci_result = (n, result) => `fib(${n}) = ${result}`;

/**
 * @param {Duration} secs
 * @returns {string}
 */
const format_duration = (secs) => {
  if (!__validate_Duration(secs)) throw new Error("SynthConstraintError: secs violates Duration constraint (got " + JSON.stringify(secs) + ")");
  let m = Math.floor(secs / 60);
  let s = pad2(secs % 60);
  return `${m}:${s}`;
};

/**
 * @param {LibraryStats} stats
 * @returns {string}
 */
const format_stats_line = (stats) => {
  let n = stats.count;
  let mins = Math.floor(stats.totalDuration / 60);
  let avg = stats.avgBpm;
  let feat = stats.featuredCount;
  return `${n} tracks · ${mins} min · avg ${avg} BPM · ${feat} featured`;
};

/**
 * @param {number} id
 * @param {TrackTitle} title
 * @param {ArtistName} artist
 * @param {BPM} bpm
 * @param {Duration} duration
 * @param {string} genre
 * @returns {Track}
 */
const create_track = (id, title, artist, bpm, duration, genre) => {
  if (!__validate_TrackTitle(title)) throw new Error("SynthConstraintError: title violates TrackTitle constraint (got " + JSON.stringify(title) + ")");
  if (!__validate_ArtistName(artist)) throw new Error("SynthConstraintError: artist violates ArtistName constraint (got " + JSON.stringify(artist) + ")");
  if (!__validate_BPM(bpm)) throw new Error("SynthConstraintError: bpm violates BPM constraint (got " + JSON.stringify(bpm) + ")");
  if (!__validate_Duration(duration)) throw new Error("SynthConstraintError: duration violates Duration constraint (got " + JSON.stringify(duration) + ")");
  return ({id, title, artist, bpm, duration, genre, featured: false});
};

/**
 * @param {Volume} vol
 * @returns {string}
 */
const set_volume = (vol) => {
  if (!__validate_Volume(vol)) throw new Error("SynthConstraintError: vol violates Volume constraint (got " + JSON.stringify(vol) + ")");
  return `Volume set to ${vol}%`;
};

/**
 * @param {string} title
 * @param {string} artist
 * @param {number} bpm
 * @param {number} duration
 * @returns {string}
 */
const validate_track_input = (title, artist, bpm, duration) => title.length === 0 ? "Title cannot be empty" : artist.length === 0 ? "Artist cannot be empty" : bpm < 60 ? "BPM too low (minimum is 60)" : bpm > 200 ? "BPM too high (maximum is 200)" : duration <= 0 ? "Duration must be greater than 0" : "";

/**
 * @param {number} bpm
 * @returns {string}
 */
const tempo_label = (bpm) => ((_m) => (_m < "90") ? "Slow" : (_m < "120") ? "Moderate" : (_m < "150") ? "Fast" : "Intense")(bpm);

/**
 * @param {string} genre
 * @returns {string}
 */
const genre_css_class = (genre) => ((_m) => (_m === "synthwave") ? "g-sw" : (_m === "darksynth") ? "g-ds" : (_m === "ambient") ? "g-amb" : (_m === "retrowave") ? "g-rw" : (_m === "cyberpunk") ? "g-cp" : "g-default")(genre);

/**
 * @param {string} genre
 * @returns {string}
 */
const genre_short = (genre) => ((_m) => (_m === "synthwave") ? "SW" : (_m === "darksynth") ? "DS" : (_m === "ambient") ? "AMB" : (_m === "retrowave") ? "RW" : (_m === "cyberpunk") ? "CP" : genre)(genre);

const library_stats = (() => {
  const __cache = new Map();
  return (tracks) => {
    const __key = JSON.stringify([tracks]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      let total_dur = $sum($map(tracks, (__x) => __x.duration));
      let total_bpm = $sum($map(tracks, (__x) => __x.bpm));
      let n_featured = $count($filter(tracks, (__x) => __x.featured));
      return {count: tracks.length, totalDuration: total_dur, avgBpm: tracks.length > 0 ? Math.round(total_bpm / tracks.length) : 0, featuredCount: n_featured};
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const fibonacci = (() => {
  const __cache = new Map();
  return (n) => {
    const __key = JSON.stringify([n]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ((_m) => (_m === 0) ? 0 : (_m === 1) ? 1 : fibonacci(n - 1) + fibonacci(n - 2))(n);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

/**
 * @param {Track} tracks
 * @returns {Track}
 */
const featured_tracks = (tracks) => $filter(tracks, (__x) => __x.featured);

/**
 * @param {Track} tracks
 * @returns {string}
 */
const all_titles = (tracks) => $map(tracks, (__x) => __x.title);

/**
 * @param {Track} tracks
 * @returns {string}
 */
const all_artists = (tracks) => $map(tracks, (__x) => __x.artist);

/**
 * @param {Track} tracks
 * @returns {number}
 */
const total_playtime = (tracks) => $sum($map(tracks, (__x) => __x.duration));

/**
 * @param {Track} tracks
 * @param {string} genre
 * @returns {Track}
 */
const tracks_in_genre = (tracks, genre) => $filter(tracks, (t) => t.genre === genre);

/**
 * @param {Track} tracks
 * @returns {boolean}
 */
const any_featured = (tracks) => $any(tracks, (__x) => __x.featured);

/**
 * @param {Track} tracks
 * @param {number} n
 * @returns {Track}
 */
const top_by_bpm = (tracks, n) => $take($sort_by_desc(tracks, (__x) => __x.bpm), n);

/**
 * @param {Track} track
 * @returns {boolean}
 */
const debug_track = (track) => {
  console.log("debug_track:", track.title);
  return true;
};

/**
 * @param {string} tag
 * @param {object} attrs
 * @param {*} ...children
 * @returns {Element}
 */
const el = (tag, attrs, ...children) => {
  let e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => (() => {
    if (k === "class") {
      return e.className = v;
    } else if (k === "id") {
      return e.id = v;
    } else if (k === "disabled") {
      return e.disabled = v;
    } else if (k === "value") {
      return e.value = v;
    } else if (k === "placeholder") {
      return e.placeholder = v;
    } else if (k === "type") {
      return e.type = v;
    } else if (k === "for") {
      return e.setAttribute("for", v);
    } else if (k.startsWith("on")) {
      return e.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      return e.setAttribute(k, String(v));
    }
})());
  $flat(children).forEach((child) => (() => {
    if (typeof child === "string") {
      return e.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      return e.appendChild(child);
    }
})());
  return e;
};

/**
 * @param {Element} container
 * @param {Element} child
 * @returns {void}
 */
const mount_into = (container, child) => container.appendChild(child);

/**
 * @param {Track} track
 * @returns {Element}
 */
const render_track_card = (track) => {
  let label = format_track_label(track);
  let dur = format_duration(track.duration);
  let bpmtag = format_bpm_tag(track.bpm);
  let tempo = tempo_label(track.bpm);
  let gclass = genre_css_class(track.genre);
  let gtag = genre_short(track.genre);
  let cardClass = track.featured ? "track-card track-featured" : "track-card";
  return el("div", {class: cardClass}, el("div", {class: "track-main"}, el("div", {class: "track-label"}, label), el("div", {class: "track-badges"}, el("span", {class: "badge genre-badge " + gclass}, gtag), el("span", {class: "badge tempo-badge"}, tempo), el("span", {class: "badge dur-badge"}, dur), el("span", {class: "badge bpm-badge"}, bpmtag))), track.featured ? el("div", {class: "featured-mark"}, "FEATURED") : el("span", {}));
};

/**
 * @param {Track} tracks
 * @returns {Element}
 */
const render_stats_bar = (tracks) => {
  let stats = library_stats(tracks);
  let line = format_stats_line(stats);
  let fib35 = fibonacci(35);
  let fibLabel = format_fibonacci_result(35, fib35);
  return el("div", {class: "stats-bar"}, el("span", {class: "stats-text"}, line), el("span", {class: "memo-badge"}, fibLabel + " (@memo)"));
};

/**
 * @param {string} genres
 * @param {string} activeGenre
 * @param {*} onFilter
 * @returns {Element}
 */
const render_genre_filters = (genres, activeGenre, onFilter) => {
  let buttons = $map(genres, (g) => el("button", {class: g === activeGenre ? "filter-btn filter-btn--active" : "filter-btn"}, g === "all" ? "All Tracks" : g));
  genres.forEach((g, i) => (() => {
    let btn = buttons[i];
    btn.addEventListener("click", () => onFilter(g));
})());
  return el("div", {class: "filter-row"}, ...buttons);
};

/**
 * @param {Element} container
 * @param {*} onAdd
 * @returns {void}
 */
const render_add_form = (container, onAdd) => {
  let titleIn = el("input", {type: "text", class: "form-inp", placeholder: "Title (required)"});
  let artistIn = el("input", {type: "text", class: "form-inp", placeholder: "Artist (required)"});
  let bpmIn = el("input", {type: "number", class: "form-inp", placeholder: "BPM 60-200"});
  let durIn = el("input", {type: "number", class: "form-inp", placeholder: "Duration (seconds)"});
  let genreIn = el("input", {type: "text", class: "form-inp", placeholder: "Genre (optional)"});
  let errEl = el("div", {class: "form-err"});
  let addBtn = el("button", {class: "add-btn"}, "Add Track");
  addBtn.addEventListener("click", () => (() => {
    let title = titleIn.value;
    let artist = artistIn.value;
    let bpm = $parse_int(bpmIn.value) ?? 0;
    let dur = $parse_int(durIn.value) ?? 0;
    let genre = genreIn.value.length > 0 ? genreIn.value : "other";
    let err = validate_track_input(title, artist, bpm, dur);
    if (err.length > 0) {
      return errEl.textContent = err;
    } else {
      errEl.textContent = "";
      let newId = Math.floor(Math.random() * 9000) + 1000;
      let track = create_track(newId, title, artist, bpm, dur, genre);
      onAdd(track);
      titleIn.value = "";
      artistIn.value = "";
      bpmIn.value = "";
      durIn.value = "";
      genreIn.value = "";
    }
})());
  container.appendChild(el("div", {class: "add-form"}, el("div", {class: "form-header"}, el("h3", {class: "form-title"}, "Add Track"), el("p", {class: "form-note"}, "create_track() has auto-injected guards for BPM (60-200), Duration (> 0), " + "TrackTitle and ArtistName (non-empty). See the transpiled JS tab.")), el("div", {class: "form-fields"}, el("div", {class: "form-row"}, titleIn, artistIn), el("div", {class: "form-row"}, bpmIn, durIn, genreIn)), errEl, addBtn));
};

/**
 * @param {string} rootId
 * @param {Track} initialTracks
 * @returns {void}
 */
const render_library = (rootId, initialTracks) => {
  let tracks = initialTracks.slice();
  let activeGenre = "all";
  let genres = ["all", "synthwave", "darksynth", "ambient", "retrowave", "cyberpunk"];
  let root = document.getElementById(rootId);
  root.innerHTML = "";
  let statsEl = el("div", {class: "stats-section"});
  let filtersEl = el("div", {class: "filters-section"});
  let listEl = el("div", {class: "track-list"});
  let formEl = el("div", {class: "form-section"});
  root.appendChild(statsEl);
  root.appendChild(filtersEl);
  root.appendChild(listEl);
  root.appendChild(formEl);
  let refresh = () => (() => {
    statsEl.innerHTML = "";
    statsEl.appendChild(render_stats_bar(tracks));
    filtersEl.innerHTML = "";
    filtersEl.appendChild(render_genre_filters(genres, activeGenre, (genre) => (() => {
      activeGenre = genre;
      return refresh();
})()));
    listEl.innerHTML = "";
    let visible = activeGenre === "all" ? tracks : tracks_in_genre(tracks, activeGenre);
    visible.forEach((t) => listEl.appendChild(render_track_card(t)));
})();
  render_add_form(formEl, (track) => (() => {
    tracks = [...tracks, track];
    return refresh();
})());
  return refresh();
};

