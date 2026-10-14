// 改动: 将被主题隐藏的「查看」菜单中的隐藏游戏命令补到「库」下拉。
(() => {
    if (window.__NEVKO_HIDDEN_GAMES_MENU__) return;
    window.__NEVKO_HIDDEN_GAMES_MENU__ = true;

    const POPUP = ".Eq8Px4ixn5sAFSR6_9wWQ";
    const ITEM = "._2jXHP0742MyApMUVUM8IFn._2uiDecKkKjAq7nimy3uLhG";
    const ADDED = "nevko-library-hidden-games";
    const COMMAND = "steam://open/library/collection/hidden";

    // 用 Steam 的菜单数据识别库菜单，避免给商店、社区或其他下拉误加入口。
    function libraryMenu(menu) {
        const key = Object.keys(menu).find(name => name.startsWith("__reactFiber$"));
        for (let fiber = menu[key]; fiber; fiber = fiber.return) {
            const props = fiber.memoizedProps;
            if (props?.refContextMenu && props.menuItems?.some(item => item?.name === "#Menu_Collections")) return props;
        }
    }

    function addEntry(menu) {
        const props = libraryMenu(menu);
        if (!props) return;
        const existing = menu.querySelector("." + ADDED);
        if (props.menuItems.some(item => item?.name === "#Menu_HiddenGames" || item?.steamURL === COMMAND)) {
            existing?.remove();
            return;
        }
        if (existing) return;
        const home = menu.querySelector(ITEM);
        if (!home) return;

        const entry = home.cloneNode(false);
        entry.removeAttribute("id");
        entry.classList.add(ADDED);
        entry.setAttribute("role", "menuitem");
        entry.tabIndex = 0;
        const lang = (document.documentElement.lang || navigator.language || "").toLowerCase();
        entry.textContent = /tchinese|zh-(tw|hk|hant)/.test(lang) || home.textContent.trim() === "首頁"
            ? "隱藏的遊戲" : /schinese|^zh/.test(lang) || home.textContent.trim() === "主页" ? "隐藏的游戏" : "Hidden Games";
        entry.setAttribute("aria-label", entry.textContent);
        entry.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            const client = window.SteamClient || window.opener?.SteamClient;
            if (typeof client?.URL?.ExecuteSteamURL === "function") {
                client.URL.ExecuteSteamURL(COMMAND);
            } else {
                window.location.href = COMMAND;
            }
            libraryMenu(menu)?.refContextMenu.current?.Hide?.();
        });
        home.after(entry);
    }

    // 将新入口接入相邻项的方向键导航；其余按键仍交给 Steam。
    document.addEventListener("keydown", event => {
        const current = event.target.closest?.(ITEM);
        const menu = current?.closest(POPUP);
        if (!menu || !menu.querySelector("." + ADDED)) return;
        const added = current.classList.contains(ADDED);
        const confirm = added && (event.key === "Enter" || event.key === " ");
        const next = event.key === "ArrowDown" ? current.nextElementSibling : event.key === "ArrowUp" ? current.previousElementSibling : null;
        if (!confirm && (!next?.matches(ITEM) || (!added && !next.classList.contains(ADDED)))) return;
        event.preventDefault();
        event.stopPropagation();
        if (confirm) current.click();
        else next.focus();
    }, true);

    let frame = 0;
    function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            document.querySelectorAll(POPUP).forEach(addEntry);
        });
    }
    schedule();
    new MutationObserver(schedule).observe(document.documentElement, {childList: true, subtree: true});
})();
