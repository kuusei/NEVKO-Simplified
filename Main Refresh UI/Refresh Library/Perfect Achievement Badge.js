(function () {
  if (window.__NEVKO_PERFECT_BADGE__) return;
  window.__NEVKO_PERFECT_BADGE__ = true;

  const ROW_SELECTOR = "._2-O4ZG0KrnSrzISHBKctFQ";
  const NAME_SELECTOR = "._2SXJM0PeFEi3gbC7V3S5pE";
  const CONTENT_SELECTOR = "._1vO6BoiVslZgs1kqDGdUs8";
  const ROW_CLASS = "nevko-perfect";
  const BADGE_CLASS = "nevko-perfect-badge";
  const NATIVE_MEDAL_SELECTOR = ".MiniAchievements .AchievementSVG svg, .AchievementSVG svg, .UAhWiMg9Q2VPsQQBj_ikT .k-QNT9kzOEOvG0U_kGmwr svg, .k-QNT9kzOEOvG0U_kGmwr svg";
  let medalTemplate = null;
  let badgeSequence = 0;
  let badgesEnabled = true;
  let silverThreshold = 80;
  const detailProgress = new Map();
  const cachedProgress = new Map();

  // Steam 原生 fullcolor 成就奖章；主页尚未渲染游戏页时使用同一图形。
  const MEDAL_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">' +
    '<path stroke="url(#nevko-ach-stroke)" fill="url(#nevko-ach-fill)" stroke-width="1.5" d="M10.1777 10.0258L10.3929 9.80693V9.49999V5.52777H14.2857H14.6001L14.8205 5.30358L18 2.06976L21.1795 5.30358L21.3999 5.52777H21.7143H25.6071V9.50001V9.80696L25.8223 10.0258L28.5553 12.8055L25.8223 15.5853L25.6071 15.8041V16.1111V20.0833H21.7143H21.3999L21.1795 20.3075L18 23.5413L14.8205 20.3075L14.6001 20.0833H14.2857H10.3929V16.1111V15.8042L10.1777 15.5853L7.44464 12.8055L10.1777 10.0258ZM14.7399 28.0317L11.56 33.4221L9.85164 29.9469L9.6456 29.5278H9.17857H6.29474L8.68445 25.3611H12.1142L14.7399 28.0317ZM26.8214 29.5278H26.3544L26.1484 29.9469L24.44 33.4221L21.2601 28.0317L23.8858 25.3611H27.3155L29.7053 29.5278H26.8214Z"></path>' +
    '<circle stroke="#FFAB2C" fill="#FFC82C" cx="18" cy="13" r="5.5"></circle>' +
    '<defs><linearGradient id="nevko-ach-fill" x1="7.08" y1="3.72" x2="33.6694" y2="25.0697" gradientUnits="userSpaceOnUse"><stop stop-color="#0056D6"></stop><stop offset="1" stop-color="#1A9FFF"></stop></linearGradient><linearGradient id="nevko-ach-stroke" x1="7.08" y1="3.72" x2="33.6694" y2="25.0697" gradientUnits="userSpaceOnUse"><stop stop-color="#0056D6"></stop><stop offset="1" stop-color="#1A9FFF"></stop></linearGradient></defs></svg>';

  function nativeMedal() {
    // 未全成就的游戏页使用单色奖章，不能拿它替换列表的全成就标记。
    return Array.from(document.querySelectorAll(NATIVE_MEDAL_SELECTOR)).find(
      (svg) => svg.querySelector("circle") && svg.querySelector("linearGradient")
    );
  }

  function updateMedalTemplate() {
    const native = nativeMedal();
    if (native) medalTemplate = native.outerHTML;
    else if (!medalTemplate) medalTemplate = MEDAL_SVG;
  }

  function createMedal(tier) {
    const holder = document.createElement("span");
    holder.innerHTML = medalTemplate;
    const svg = holder.firstElementChild;
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    // 达到设置的门槛但不足 100% 时沿用原生奖章轮廓，绶带与圆心改为银色。
    if (tier === "silver") {
      svg.querySelectorAll("linearGradient stop").forEach((stop) => {
        const color = parseFloat(stop.getAttribute("offset") || "0") >= 1 ? "#E0E7EF" : "#8E9CAC";
        stop.setAttribute("stop-color", color);
        stop.style.setProperty("stop-color", color);
      });
      svg.querySelectorAll("circle").forEach((circle) => {
        circle.setAttribute("fill", "#E7EDF3");
        circle.setAttribute("stroke", "#A8B3C0");
      });
    }

    // 每个副本独立的渐变 ID，避免列表回收或游戏页切换后引用失效。
    const ids = new Map();
    const prefix = "nevko-perfect-" + (++badgeSequence) + "-";
    svg.querySelectorAll("[id]").forEach((el, index) => {
      ids.set(el.id, prefix + index);
      el.id = prefix + index;
    });
    svg.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        let value = attr.value;
        ids.forEach((newId, oldId) => {
          value = value.split("url(#" + oldId + ")").join("url(#" + newId + ")");
        });
        if (value !== attr.value) el.setAttribute(attr.name, value);
      });
      // Steam 列表和主题的进度圆环规则会覆盖 SVG 展示属性。
      // 用内联样式保留当前等级的颜色和描边，避免进度圆环样式覆盖奖章。
      ["fill", "stroke", "stroke-width"].forEach((attr) => {
        if (el.hasAttribute(attr)) el.style.setProperty(attr, el.getAttribute(attr));
      });
      if (el.hasAttribute("stroke") && !el.hasAttribute("stroke-width")) {
        el.style.setProperty("stroke-width", "1");
      }
    });
    return svg;
  }

  function applyMedal(badge, tier) {
    badge.replaceChildren(createMedal(tier));
    badge.__nevkoMedalTemplate = medalTemplate;
    badge.dataset.tier = tier;
  }

  function createBadge(tier) {
    const badge = document.createElement("span");
    badge.className = BADGE_CLASS;
    applyMedal(badge, tier);
    return badge;
  }

  function reactKey(el, prefix) {
    const names = Object.getOwnPropertyNames(el);
    for (let i = 0; i < names.length; i++) {
      if (names[i].startsWith(prefix)) return el[names[i]];
    }
    for (const key in el) {
      if (key.startsWith(prefix)) return el[key];
    }
    return null;
  }

  function coerceAppId(value) {
    if (typeof value === "number" && value > 0 && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) {
      const id = Number(value);
      if (id > 0) return id;
    }
    return null;
  }

  function readAppId(value, depth, seen) {
    if (value == null || depth > 8) return null;
    if (typeof value !== "object") return coerceAppId(value);
    if (seen.has(value)) return null;
    seen.add(value);

    const fromField =
      coerceAppId(value.appid) ||
      coerceAppId(value.appID) ||
      coerceAppId(value.unAppID) ||
      coerceAppId(value.nAppID);
    if (fromField) return fromField;

    return (
      readAppId(value.item, depth + 1, seen) ||
      readAppId(value.app, depth + 1, seen) ||
      readAppId(value.overview, depth + 1, seen) ||
      readAppId(value.m_overview, depth + 1, seen)
    );
  }

  function getAppIdFromNode(el) {
    if (!el) return null;

    const props = reactKey(el, "__reactProps$") || reactKey(el, "__reactEventHandlers$");
    const fromProps = readAppId(props, 0, new WeakSet());
    if (fromProps) return fromProps;

    let fiber = reactKey(el, "__reactFiber$") || reactKey(el, "__reactInternalInstance$");
    for (let i = 0; i < 50 && fiber; i++) {
      const id = readAppId(fiber.memoizedProps, 0, new WeakSet());
      if (id) return id;
      fiber = fiber.return;
    }
    return null;
  }

  function getAppId(row) {
    return (
      getAppIdFromNode(row.querySelector(CONTENT_SELECTOR)) ||
      getAppIdFromNode(row.querySelector(NAME_SELECTOR)) ||
      getAppIdFromNode(row)
    );
  }

  function steamRoot() {
    return (window.opener && window.opener.appAchievementProgressCache && window.opener) || window;
  }

  function getProgressMap() {
    return steamRoot().appAchievementProgressCache?.m_achievementProgress?.mapCache;
  }

  function getEntry(appid) {
    const map = getProgressMap();
    if (appid == null) return null;
    const id = Number(appid);
    const current = map && (map.get(id) || map.get(String(id)));
    const previous = cachedProgress.get(id);
    if (isCompleteProgress(current?.total, current?.unlocked) &&
        (!previous || (current.cache_time || 0) >= (previous.cache_time || 0))) {
      // 保存数值副本，避免 Steam 更新原对象或暂时移除条目时丢失已确认状态。
      cachedProgress.set(id, {
        total: current.total,
        unlocked: current.unlocked,
        cache_time: current.cache_time,
      });
    }
    const entry = cachedProgress.get(id);
    const detail = detailProgress.get(id);
    // 游戏详情来自当前客户端，优先于可能仍停在上次游玩前的列表缓存。
    if (detail && (!entry || !(entry.cache_time >= detail.observedAt))) return detail;
    return entry || null;
  }

  function isCompleteProgress(total, unlocked) {
    // 0/0 是打开游戏页时的占位状态，不能用它否定已经确认的进度。
    return Number.isInteger(total) && total > 0 &&
      Number.isInteger(unlocked) && unlocked >= 0 && unlocked <= total;
  }

  function readLoadedDetails() {
    const now = Date.now() / 1000;
    // 只读 Steam 已加载的数据，不为列表逐个请求整份游戏详情。
    steamRoot().appDetailsStore?.m_mapAppData?.forEach((data, appid) => {
      const achievements = data.details?.achievements;
      // Steam 原生也用 vecHighlight 是否存在判断成就详情是否加载完成。
      if (data.bLoadingAchievments || !Array.isArray(achievements?.vecHighlight) ||
          !isCompleteProgress(achievements.nTotal, achievements.nAchieved)) return;
      const id = Number(appid);
      const previous = detailProgress.get(id);
      if (previous?.total === achievements.nTotal &&
          previous.unlocked === achievements.nAchieved) return;
      detailProgress.set(id, {
        total: achievements.nTotal,
        unlocked: achievements.nAchieved,
        observedAt: now,
      });
    });
  }

  function badgeTier(entry) {
    if (!badgesEnabled || !isCompleteProgress(entry?.total, entry?.unlocked)) return null;
    if (entry.unlocked === entry.total) return "perfect";
    // 精确比较含边界的门槛，不将不足门槛的进度四舍五入；0 表示关闭银色奖章。
    return silverThreshold > 0 && entry.unlocked * 100 >= entry.total * silverThreshold ? "silver" : null;
  }

  function normalizeName(name) {
    return (name || "").replace(/\s+\[[^\]]+\]\s*$/, "").trim();
  }

  function getRowName(row) {
    const named = row.querySelector(NAME_SELECTOR);
    if (named) return normalizeName(named.textContent);

    const content = row.querySelector(CONTENT_SELECTOR);
    if (!content) return normalizeName(row.textContent);

    const spans = content.querySelectorAll(":scope > span");
    const text = spans.length ? spans[spans.length - 1].textContent : content.textContent;
    return normalizeName(text);
  }

  function badgeEntriesByName() {
    const names = new Map();
    const map = getProgressMap();
    const store = steamRoot().appStore;
    if (!store || typeof store.GetAppOverviewByAppID !== "function") return names;

    const ids = new Set([...(map?.keys() || []), ...cachedProgress.keys(), ...detailProgress.keys()]);
    ids.forEach((appid) => {
      const entry = getEntry(appid);
      if (!badgeTier(entry)) return;
      const overview = store.GetAppOverviewByAppID(Number(appid));
      const name = normalizeName(overview && overview.display_name);
      if (name) names.set(name, entry);
    });
    return names;
  }

  function nameHost(row) {
    const named = row.querySelector(NAME_SELECTOR);
    if (named) return named.querySelector("span") || named;

    const content = row.querySelector(CONTENT_SELECTOR);
    if (!content) return row;

    const spans = content.querySelectorAll(":scope > span");
    return spans[spans.length - 1] || content;
  }

  function ensureBadge(row, tier, entry) {
    let badge = row.querySelector("." + BADGE_CLASS);
    if (badge) {
      if (badge.__nevkoMedalTemplate !== medalTemplate || badge.dataset.tier !== tier) applyMedal(badge, tier);
    } else {
      badge = createBadge(tier);
      nameHost(row).appendChild(badge);
    }
    badge.title = Math.floor(entry.unlocked / entry.total * 100) + "%";
    badge.setAttribute("aria-label", "成就完成率 " + badge.title);
    return badge;
  }

  function refresh() {
    if (document.hidden) return;
    const rows = document.querySelectorAll(ROW_SELECTOR);
    if (!rows.length) return;
    const settings = getComputedStyle(document.documentElement);
    badgesEnabled = settings.getPropertyValue("--nevko-achievement-badges-enabled").trim() !== "0";
    if (!badgesEnabled) {
      rows.forEach((row) => {
        row.classList.remove(ROW_CLASS);
        row.querySelector("." + BADGE_CLASS)?.remove();
      });
      return;
    }
    const threshold = settings.getPropertyValue("--nevko-silver-achievement-threshold").trim();
    silverThreshold = threshold === "0" ? 0 : threshold === "60" ? 60 : 80;
    updateMedalTemplate();
    readLoadedDetails();
    let names;
    rows.forEach((row) => {
      const appid = getAppId(row);
      // 能读取 appid 时直接查缓存；只有无 appid 的列表项才需要名称兜底。
      const entry = appid != null ? getEntry(appid) : (names ||= badgeEntriesByName()).get(getRowName(row));
      const tier = badgeTier(entry);
      row.classList.toggle(ROW_CLASS, tier === "perfect");

      const existing = row.querySelector("." + BADGE_CLASS);
      if (tier) ensureBadge(row, tier, entry);
      else if (existing) existing.remove();
    });
  }

  let scheduled = false;
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  }

  function start() {
    if (!document.body) {
      setTimeout(start, 400);
      return;
    }

    new MutationObserver(scheduleRefresh).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    refresh();
    document.addEventListener("visibilitychange", scheduleRefresh);
    setInterval(refresh, 1500);
  }

  start();
})();
