const query = `
query Popups($filters: PopupFiltersInput) {
  popups(filters: $filters) {
    html
    form
    documentId
    brand {
      documentId
    }
  }
}`

const baseUrl = "http://localhost:1337/graphql"
;(async function () {
  const popupId = document.currentScript.getAttribute("data-popup-id")
  // Load Tailwind first
  if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
    const tailwindScript = document.createElement("script")
    tailwindScript.src = "https://cdn.tailwindcss.com"
    document.head.appendChild(tailwindScript)
    await new Promise((resolve) => {
      tailwindScript.onload = resolve
    })

    // Add Tailwind config after Tailwind is loaded
    const configScript = document.createElement("script")
    document.head.appendChild(configScript)
  }

  if (!popupId) return
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        filters: {
          documentId: {
            eq: popupId,
          },
        },
      },
    }),
  })

  const config = await res.json()
  const popup = config.data.popups[0]
  const html = popup.html
  const form = popup.form

  // Inject popup container
  const wrapper = document.createElement("div")
  wrapper.innerHTML = `
    <div 
      id="popup-container"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white shadow-lg rounded-lg p-4 relative max-w-lg w-full mx-4">
        ${html}
      </div>
    </div>
  `

  document.body.appendChild(wrapper)

  // Add vanilla JavaScript for popup functionality
  const popupContainer = document.getElementById("popup-container")
  const closeButton = document.getElementById("close-popup")

  closeButton.addEventListener("click", () => {
    popupContainer.style.display = "none"
  })

  const submitButton = document.getElementById("submit-popup")
  submitButton.addEventListener("click", (e) => {
    let hasErrors = false

    // Remove any existing error messages
    document.querySelectorAll(".error-message").forEach((el) => el.remove())
    document
      .querySelectorAll(".border-red-500")
      .forEach((el) => el.classList.remove("border-red-500"))

    for (const field of form) {
      const id = field.id
      const required = field.required
      const input = document.getElementById(`preview-${id}`)
      const value = input.value.trim()

      if (required && !value) {
        hasErrors = true
        // Add red border to input
        input.classList.add("border-red-500")

        // Create and insert error message
        const errorDiv = document.createElement("div")
        errorDiv.className = "error-message text-red-500 text-xs mt-1"
        errorDiv.textContent = "This field is required"

        // Insert error message after the input's parent div
        input.parentElement.appendChild(errorDiv)
      }
      console.log({ id, value, required })
    }

    if (hasErrors) {
      return
    }

    // If no errors, proceed with form submission
    console.log("Form submitted successfully")
  })

  // Add input event listeners to remove error styling when user starts typing
  for (const field of form) {
    const input = document.getElementById(`preview-${field.id}`)
    if (input) {
      input.addEventListener("input", () => {
        input.classList.remove("border-red-500")
        const errorMessage = input.parentElement.querySelector(".error-message")
        if (errorMessage) {
          errorMessage.remove()
        }
      })
    }
  }
})()
