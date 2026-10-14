// Compact Buttons - Simply. Dark. - Shadow | Fixed Script
;(() => {
  if (window.__NEVKO_COMPACT_BUTTONS__) return
  window.__NEVKO_COMPACT_BUTTONS__ = true
  const TITLE_BAR_SELECTOR = "._3cykd-VfN_xBxf3Qxriccm"
  const BOTTOM_BAR_SELECTOR = "._1_yS5UP7el0aN4vntx3dx"
  const BUTTON_GAP = 5

  let currentTitleBar = null
  let currentBottomBar = null
  let titleBarObserver = null
  let bottomBarObserver = null
  let resizeObserver = null
  let frame = 0

  function schedule() {
    if (document.hidden || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      init()
    })
  }

  function applyPosition() {
    if (document.hidden || !currentTitleBar || !currentBottomBar) return

    // 按右侧真实可见按钮的位置对齐，避免 Steam 新增包装层或留白后固定偏移失准。
    const controls = Array.from(currentTitleBar.children)
      .filter((element) => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
      .map((element) => element.getBoundingClientRect())
      .filter((bounds) => bounds.width > 0 && bounds.height > 0)
    if (!controls.length) return
    const anchorLeft = Math.min(...controls.map((bounds) => bounds.left))
    const parent = currentBottomBar.offsetParent || document.documentElement
    const parentRight = parent.getBoundingClientRect().left + parent.clientLeft + parent.clientWidth
    const marginRight = parseFloat(getComputedStyle(currentBottomBar).marginRight) || 0
    const right = Math.round((parentRight - anchorLeft + BUTTON_GAP - marginRight) * 100) / 100
    // 只在值变化时写入，避免 style 监听器因自身写入持续触发。
    const positions = { position: "absolute", left: "auto", right: `${right}px` }
    for (const [property, value] of Object.entries(positions)) {
      if (currentBottomBar.style.getPropertyValue(property) !== value ||
          currentBottomBar.style.getPropertyPriority(property) !== "important") {
        currentBottomBar.style.setProperty(property, value, "important")
      }
    }
  }

  function cleanup() {
    if (titleBarObserver) {
      titleBarObserver.disconnect()
      titleBarObserver = null
    }
    if (bottomBarObserver) {
      bottomBarObserver.disconnect()
      bottomBarObserver = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  function setupObservers() {
    cleanup()

    titleBarObserver = new MutationObserver(schedule)
    titleBarObserver.observe(currentTitleBar, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    bottomBarObserver = new MutationObserver(schedule)
    bottomBarObserver.observe(currentBottomBar, {
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(currentTitleBar)
    resizeObserver.observe(currentBottomBar)
  }

  function init() {
    const titleBar = document.querySelector(TITLE_BAR_SELECTOR)
    const bottomBar = document.querySelector(BOTTOM_BAR_SELECTOR)

    if (!titleBar || !bottomBar) return false

    const elementsChanged = titleBar !== currentTitleBar || bottomBar !== currentBottomBar

    currentTitleBar = titleBar
    currentBottomBar = bottomBar

    if (elementsChanged) {
      setupObservers()
    }

    applyPosition()
    return true
  }

  const bodyObserver = new MutationObserver(schedule)

  function startWatching() {
    schedule()

    if (document.body) {
      // 包括主题样式表的加载、切换，无需每 2 秒轮询整个页面。
      bodyObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href"],
      })
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatching)
  } else {
    startWatching()
  }

  window.addEventListener("load", schedule)
  document.addEventListener("load", schedule, true)
  window.addEventListener("resize", schedule)
  document.addEventListener("visibilitychange", schedule)
})()
