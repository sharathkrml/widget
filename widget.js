;(async function () {
  const script = document.currentScript
  const popupId = script.getAttribute("data-popup-id")
  if (!popupId) return

  const res = await fetch(`response.json`)
  const config = await res.json()

  // Inject Alpine.js if not already available
  if (!window.Alpine) {
    const alpineScript = document.createElement("script")
    alpineScript.src = "https://cdn.jsdelivr.net/npm/alpinejs"
    alpineScript.defer = true
    document.head.appendChild(alpineScript)
    await new Promise((res) => (alpineScript.onload = res))
  }

  // Inject popup container
  const wrapper = document.createElement("div")
  wrapper.innerHTML = `
    <div 
      x-data="{ open: true }" 
      x-show="open" 
      x-transition 
      style="${config.inlineStyles || ""}" 
      class="${config.class || ""}"
    >
      ${config.html}
      <button @click="open = false" style="margin-left: 10px;">×</button>
    </div>
  `

  if (config.css) {
    const styleTag = document.createElement("style")
    styleTag.textContent = config.css
    document.head.appendChild(styleTag)
  }

  document.body.appendChild(wrapper)
})()
