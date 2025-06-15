const query = `
query Popups($filters: PopupFiltersInput) {
  popups(filters: $filters) {
    html
    config
    documentId
    brand {
      documentId
    }
  }
}`

;(async function () {
  const popupId = document.currentScript.getAttribute("data-popup-id")
  if (!popupId) return
  const trimmedPopupId = popupId.split("popup_")[1]
  if (!trimmedPopupId) return

  const baseUrl = document.currentScript.getAttribute("data-base-url")
  if (!baseUrl) return
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

  const res = await fetch(`${baseUrl}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        filters: {
          documentId: {
            eq: trimmedPopupId,
          },
        },
      },
    }),
  })

  const response = await res.json()
  const popup = response.data.popups[0]
  const popupDocumentId = popup.documentId
  console.log({ popup })
  const html = popup.html
  const form = popup.config.form_fields
  const displayTrigger = popup.config.display_trigger

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

  // Initially hide the popup container
  popupContainer.style.display = "none"

  // Handle display triggers
  if (displayTrigger === "immediate") {
    popupContainer.style.display = "flex"
  } else if (displayTrigger.startsWith("delay-")) {
    const delay = parseInt(displayTrigger.split("-")[1])
    setTimeout(() => {
      popupContainer.style.display = "flex"
    }, delay * 1000)
  } else if (displayTrigger.startsWith("scroll-")) {
    const scrollPercent = parseInt(displayTrigger.split("-")[1])
    window.addEventListener("scroll", () => {
      const currentScrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100
      if (currentScrollPercent >= scrollPercent) {
        popupContainer.style.display = "flex"
        window.removeEventListener("scroll", arguments.callee)
      }
    })
  } else if (displayTrigger === "exit") {
    document.addEventListener("mouseleave", (e) => {
      if (e.clientY <= 0) {
        popupContainer.style.display = "flex"
        document.removeEventListener("mouseleave", arguments.callee)
      }
    })
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      popupContainer.style.display = "none"
    })
  }

  const submitButton = document.getElementById("submit-popup")
  let submitData = {}
  if (submitButton) {
    submitButton.addEventListener("click", async (e) => {
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
        let value = input.value.trim()
        if (field.type === "checkbox") {
          value = input.checked
        }
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
        submitData[id] = value
      }

      if (hasErrors) {
        return
      }

      // If no errors, proceed with form submission
      console.log("Form submitted successfully")
      const submitResponse = await fetch(`${baseUrl}/api/user-popup-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          popupId: popupDocumentId,
          data: submitData,
        }),
      })
      const submitResponseData = await submitResponse.json()
      console.log({ submitResponseData })
    })
  }

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
