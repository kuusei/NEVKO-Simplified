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
