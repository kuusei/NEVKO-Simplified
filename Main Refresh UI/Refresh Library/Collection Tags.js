(() => {
    if (window.__NEVKO_COLLECTION_TAGS__) return;
    window.__NEVKO_COLLECTION_TAGS__ = true;

    const TAGS = "._2b6WkTnmJxMuX1biL7aS3C";
    const HERO = "._6-WKlwpwjgMWFow-NM_W4";
    const STATS = "._1YbtIWcfkQJOysLXQbwzRf";
    const PAGE = "._2Nq6ov7A1hGcHXVOXNt_OE";
    const SCROLLER = "._3lDczhulqraStjCitLYJ1K";
    const TOP = "--nevko-collection-top";
    const observed = new Set();
    let frame = 0;

    function update() {
        frame = 0;
        const elements = new Set();
        document.querySelectorAll(TAGS).forEach((tags) => {
            const hero = tags.closest(HERO);
            const page = tags.closest(PAGE);
            if (!hero || !page) return;
            elements.add(hero);
            elements.add(tags);
            const rect = tags.getBoundingClientRect();
            const parent = tags.offsetParent || hero;
            const parentRect = parent.getBoundingClientRect();
            const scale = parent.offsetHeight ? parentRect.height / parent.offsetHeight : 1;
            if (!rect.width || !rect.height || scale <= 0) return;

            // 从原生 top:16px 的位置计算，避免移开后下一帧又跳回导致振荡。
            const previous = parseFloat(tags.style.getPropertyValue(TOP)) || 16;
            const baseTop = rect.top - (previous - 16) * scale;
            let top = 16;
            page.querySelectorAll(STATS).forEach((stats) => {
                elements.add(stats);
                // Steam 同时保留浮动和页内播放栏，只避让真正显示的一份。
                if (!stats.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return;
                const info = stats.getBoundingClientRect();
                if (!info.width || !info.height) return;
                if (rect.left < info.right && rect.right > info.left &&
                    baseTop < info.bottom && baseTop + rect.height > info.top) {
                    top = Math.max(top, 16 + (info.bottom + 8 * scale - baseTop) / scale);
                }
            });
            const value = `${Math.round(top * 100) / 100}px`;
            if (tags.style.getPropertyValue(TOP) !== value) tags.style.setProperty(TOP, value);
        });
        observed.forEach((element) => {
            if (!elements.has(element)) {
                resizeObserver.unobserve(element);
                observed.delete(element);
            }
        });
        elements.forEach((element) => {
            if (!observed.has(element)) {
                observed.add(element);
                resizeObserver.observe(element);
            }
        });
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    const resizeObserver = new ResizeObserver(schedule);
    new MutationObserver((records) => {
        if (records.some((record) => record.type === "childList" ||
            (record.target.matches(`${HERO}, ${STATS}, ${SCROLLER}`) ||
                record.target.closest(HERO)))) schedule();
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, true);
    schedule();
})();
