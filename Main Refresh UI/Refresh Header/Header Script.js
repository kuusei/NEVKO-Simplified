function handleClick(event) {
    const clickedElement = event.target.closest('._7AlhCx3XGzBeIrQaCneUD');
    if (clickedElement) {
        const elementToActivate = clickedElement.querySelector('._19axKcqYRuaJ8vdYKYmtTQ');
        if (elementToActivate) {
            elementToActivate.click();
        }
    }
}

document.addEventListener('click', handleClick);
document.addEventListener('click', () => scheduleMoveNavArrows());

const URL_BAR = '._1bGewp3tfzqAF6fVTFFUOz .UkR3sY319PuaUNuUWks2K';
const NAV_ARROW = '._25lBLzuVeYAUG279up4xP8';
const REFRESH_BTN = '._3KaB94Jl4r0hFkthDPJy09';
const URL_TEXT = '._2m_orETo6AghzAnc0sISCt';

function isWebPage() {
    const urlBar = document.querySelector(URL_BAR);
    const text = urlBar && urlBar.querySelector(URL_TEXT)
        ? urlBar.querySelector(URL_TEXT).textContent || ''
        : '';
    return /https?:\/\//i.test(text);
}

function moveNavArrowsIntoUrlBar() {
    const web = isWebPage();
    document.documentElement.classList.toggle('nevko-web-nav', web);
    if (!web) return;

    const urlBar = document.querySelector(URL_BAR);
    const refresh = urlBar && urlBar.querySelector(REFRESH_BTN);
    if (!urlBar || !refresh) return;

    const alreadyInBar = urlBar.querySelectorAll(NAV_ARROW);
    if (alreadyInBar.length >= 2) return;

    const arrows = Array.from(document.querySelectorAll(NAV_ARROW)).filter(
        (el) => !urlBar.contains(el)
    );
    if (arrows.length < 2) return;

    urlBar.insertBefore(arrows[0], refresh);
    urlBar.insertBefore(arrows[1], refresh);
}

let navArrowFrame = 0;
function scheduleMoveNavArrows() {
    if (navArrowFrame) return;
    navArrowFrame = requestAnimationFrame(() => {
        navArrowFrame = 0;
        moveNavArrowsIntoUrlBar();
    });
}

moveNavArrowsIntoUrlBar();
new MutationObserver(scheduleMoveNavArrows).observe(document.documentElement, {
    childList: true,
    subtree: true,
});

// 截图入口与添加游戏/下载/好友归为同一组；大屏幕保留 Steam 原生按钮和事件。
(() => {
    if (window.__NEVKO_SCREENSHOTS_BUTTON__) return;
    window.__NEVKO_SCREENSHOTS_BUTTON__ = true;

    const SOCIAL_BAR = "._3vCzSrrXZzZjVJFZNg9SGu";
    const BUTTON_CLASS = "nevko-header-screenshots";
    // 横向相机机身和独立镜头，去掉额外方块底，保持与旁边图标相近的视觉大小。
    const SCREENSHOTS_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" fill-rule="evenodd" d="M9 3h6l2 3h3.5A2.5 2.5 0 0 1 23 8.5v10a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 1 18.5v-10A2.5 2.5 0 0 1 3.5 6H7l2-3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm7 .5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"></path>' +
        '<circle fill="currentColor" cx="12" cy="13" r="3"></circle>' +
        '</svg>';

    function openScreenshots(event) {
        event.stopPropagation();
        const client = window.SteamClient || window.opener?.SteamClient;
        // 与 Steam 菜单的 Screenshots 命令一致；NavigateLibrary 不支持 media。
        if (typeof client?.URL?.ExecuteSteamURL === "function") {
            client.URL.ExecuteSteamURL("steam://open/screenshots");
        } else {
            window.location.href = "steam://open/screenshots";
        }
    }

    function ensureScreenshotsButton() {
        const bar = document.querySelector(SOCIAL_BAR);
        if (!bar || bar.querySelector("." + BUTTON_CLASS)) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = BUTTON_CLASS;
        button.setAttribute("aria-label", "查看截图");
        button.innerHTML = SCREENSHOTS_SVG;
        button.addEventListener("click", openScreenshots);
        bar.prepend(button);
    }

    let frame = 0;
    function schedule() {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            ensureScreenshotsButton();
        });
    }

    ensureScreenshotsButton();
    new MutationObserver(schedule).observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
})();
