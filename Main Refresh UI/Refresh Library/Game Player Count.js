(() => {
    if (window.__NEVKO_GAME_PLAYER_COUNT__) return;
    window.__NEVKO_GAME_PLAYER_COUNT__ = true;

    const HERO = "._6-WKlwpwjgMWFow-NM_W4";
    const PAGE = "._2Nq6ov7A1hGcHXVOXNt_OE";
    const PLAY = "._1FnJ6dPuknQFQ2RTpKTI16";
    const CHIP = "nevko-game-player-count";
    const CACHE_MS = 15 * 60 * 1000;
    // 只共享缓存；请求串行化交给浏览器原生锁，不额外维护共享调度器。
    const stateHost = window.opener || window;
    const cache = stateHost.__NEVKO_GAME_PLAYER_COUNT_CACHE__ ||= new Map();
    const format = new Intl.NumberFormat();
    let currentId = null;
    let hosts = [];
    let pending = 0;
    let frame = 0;
    let controller = null;
    let querying = false;
    let tooltip = null;
    let tooltipAnchor = null;
    let tooltipTimer = 0;

    function enabled() {
        return getComputedStyle(document.documentElement).getPropertyValue("--nevko-game-player-count-enabled").trim() === "1";
    }

    function overview(hero) {
        const key = Object.getOwnPropertyNames(hero).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
        let fiber = hero[key];
        for (let i = 0; fiber && i < 24; i++, fiber = fiber.return) {
            const app = fiber.memoizedProps?.overview;
            if (app) return app;
        }
        return null;
    }

    function selection() {
        // 切换动画可能短暂保留旧页，优先最后一份可见游戏封面。
        const hero = Array.from(document.querySelectorAll(HERO)).reverse().find((node) =>
            node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        );
        if (!hero) return null;
        const app = overview(hero);
        const id = app?.appid;
        // 非 Steam 快捷方式使用高位 appid，不向公共接口发送这些本地标识。
        if (!Number.isInteger(id) || id <= 0 || id >= 0x80000000 || app.BIsNonSteamShortcut?.()) return null;
        const page = hero.closest(PAGE);
        const buttons = page ? Array.from(page.querySelectorAll(PLAY)) : [];
        return buttons.length ? { id, buttons } : null;
    }

    function openCharts(event) {
        event.preventDefault();
        event.stopPropagation();
        hideTooltip();
        const id = Number(event.currentTarget.dataset.appid);
        if (!id) return;
        const url = "steam://openurl/https://steamdb.info/app/" + id + "/charts/";
        const client = window.SteamClient || window.opener?.SteamClient;
        if (typeof client?.URL?.ExecuteSteamURL === "function") client.URL.ExecuteSteamURL(url);
        else window.location.href = url;
    }

    function hideTooltip() {
        clearTimeout(tooltipTimer);
        tooltipTimer = 0;
        tooltipAnchor?.removeAttribute("aria-describedby");
        tooltipAnchor = null;
        tooltip?.remove();
        tooltip = null;
    }

    function updateTooltip() {
        if (!tooltip || !tooltipAnchor) return;
        const text = tooltipAnchor.dataset.tooltip;
        if (tooltip.textContent !== text) tooltip.textContent = text;
        const anchor = tooltipAnchor.getBoundingClientRect();
        const bounds = tooltip.getBoundingClientRect();
        // 使用窗口坐标避开封面裁切；靠近窗口边缘时翻到标签另一侧。
        tooltip.style.left = Math.max(8, Math.min(anchor.left, window.innerWidth - bounds.width - 8)) + "px";
        const top = anchor.bottom + 8;
        tooltip.style.top = Math.max(8, top + bounds.height <= window.innerHeight - 8 ? top : anchor.top - bounds.height - 8) + "px";
    }

    function showTooltip(chip, delay) {
        hideTooltip();
        tooltipAnchor = chip;
        tooltipTimer = setTimeout(() => {
            tooltipTimer = 0;
            if (!chip.isConnected || Number(chip.dataset.appid) !== currentId || !enabled() || document.hidden ||
                !chip.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
                hideTooltip();
                return;
            }
            tooltip = document.createElement("div");
            // 复用 Steam 原生 Tooltip 类，跟随主题的提示框颜色、字号与阴影。
            tooltip.className = "_2FxbHJzYoH024ko7zqcJOf nevko-game-player-tooltip";
            tooltip.id = "nevko-game-player-tooltip";
            tooltip.setAttribute("role", "tooltip");
            document.body.appendChild(tooltip);
            chip.setAttribute("aria-describedby", tooltip.id);
            updateTooltip();
        }, delay);
    }

    function render() {
        const entry = cache.get(currentId);
        const hasCount = Number.isInteger(entry?.count);
        const value = hasCount ? format.format(entry.count) : entry?.error ? "暂不可用" : "…";
        const state = hasCount ? "ready" : entry?.error ? "error" : "loading";
        const hint = hasCount
            ? "Steam 当前在线玩家\n更新于 " + new Date(entry.fetchedAt).toLocaleTimeString() + (entry.error ? "\n刷新失败，显示上次数据" : "")
            : "当前在线人数" + (entry?.error ? "暂不可用，稍后重试" : "正在查询");
        hosts.forEach((host) => {
            let chip = host.querySelector(":scope > ." + CHIP);
            if (!chip) {
                chip = document.createElement("button");
                chip.type = "button";
                chip.className = CHIP;
                chip.innerHTML = '<span class="nevko-player-dot" aria-hidden="true"></span><span>当前在线</span><span class="nevko-player-value"></span>';
                chip.addEventListener("click", openCharts);
                chip.addEventListener("pointerdown", (event) => event.stopPropagation());
                chip.addEventListener("pointerenter", () => showTooltip(chip, 300));
                chip.addEventListener("pointerleave", hideTooltip);
                chip.addEventListener("focus", () => showTooltip(chip, 0));
                chip.addEventListener("blur", hideTooltip);
                chip.addEventListener("keydown", (event) => {
                    if (event.key === "Escape") hideTooltip();
                });
                host.appendChild(chip);
            }
            chip.dataset.appid = String(currentId);
            chip.dataset.state = state;
            const number = chip.querySelector(".nevko-player-value");
            if (number.textContent !== value) number.textContent = value;
            chip.removeAttribute("title");
            chip.dataset.tooltip = hint;
            chip.setAttribute("aria-label", "当前在线人数 " + value);
        });
        updateTooltip();
    }

    function needsQuery(id) {
        const entry = cache.get(id);
        return !(entry?.nextQueryAt > Date.now());
    }

    async function query(id) {
        pending = 0;
        if (id !== currentId || !enabled() || document.hidden || querying) return;
        if (!needsQuery(id)) { schedule(); return; }
        querying = true;
        try {
            await navigator.locks.request("nevko-game-player-count", async () => {
                // 等待其他窗口的请求完成后，再检查缓存与选择，避免重复查询或查已切走的游戏。
                if (id !== currentId || !enabled() || document.hidden || !needsQuery(id)) return;
                const request = new AbortController();
                controller = request;
                const timeout = setTimeout(() => request.abort(), 8000);
                try {
                    const params = new URLSearchParams({ appid: String(id), origin: "https://steamloopback.host" });
                    const response = await fetch("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?" + params, {
                        credentials: "omit", signal: request.signal,
                    });
                    if (!response.ok) throw new Error("Steam API " + response.status);
                    const data = (await response.json())?.response;
                    if (data?.result !== 1 || !Number.isInteger(data.player_count) || data.player_count < 0) throw new Error("Invalid player count");
                    cache.set(id, { count: data.player_count, fetchedAt: Date.now(), nextQueryAt: Date.now() + CACHE_MS });
                } catch (_) {
                    cache.set(id, { ...cache.get(id), error: true, nextQueryAt: Date.now() + CACHE_MS });
                } finally {
                    clearTimeout(timeout);
                    controller = null;
                }
            });
        } catch (_) {
            cache.set(id, { ...cache.get(id), error: true, nextQueryAt: Date.now() + CACHE_MS });
        } finally {
            querying = false;
            // 旧游戏请求只写自己的缓存，不能把人数显示到新游戏上。
            schedule();
        }
    }

    function sync() {
        frame = 0;
        const selected = enabled() && !document.hidden ? selection() : null;
        const id = selected?.id || null;
        if (id !== currentId || !selected) {
            clearTimeout(pending);
            pending = 0;
            currentId = id;
        }
        hosts = selected?.buttons || [];
        if (tooltipAnchor && (Number(tooltipAnchor.dataset.appid) !== id || !hosts.includes(tooltipAnchor.parentElement))) hideTooltip();
        document.querySelectorAll("." + CHIP).forEach((chip) => {
            if (!hosts.includes(chip.parentElement)) chip.remove();
        });
        if (!selected) {
            controller?.abort();
            return;
        }
        render();
        if (!pending && !querying) {
            // 同一个定时器：新游戏停留 1 秒再查询；已有数据等满 15 分钟。
            const delay = needsQuery(id) ? 1000 : cache.get(id).nextQueryAt - Date.now();
            pending = setTimeout(() => query(id), delay);
        }
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(sync);
    }

    new MutationObserver(schedule).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "src", "href"],
    });
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("scroll", schedule, true);
    document.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("resize", hideTooltip);
    window.addEventListener("pagehide", () => {
        clearTimeout(pending);
        pending = 0;
        hideTooltip();
        controller?.abort();
    });
    schedule();
})();
