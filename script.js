// User management variables
let currentUser = null
const users = JSON.parse(localStorage.getItem("havenUsers") || "[]")
const reservations = JSON.parse(localStorage.getItem("havenReservations") || "[]")

// Add these new variables at the top with other global variables
let selectedMenuItems = []
let currentReservationStep = 1 // 1: Menu Selection, 2: Table Booking

// Add this variable at the top with other global variables
let currentEditingReservation = null

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus()
  setMinDate()
  initializeEventListeners()
})

// Set minimum date for reservations to today
function setMinDate() {
  const today = new Date().toISOString().split("T")[0]
  const dateInput = document.getElementById("reservationDate")
  if (dateInput) {
    dateInput.min = today
  }
}

// Initialize all event listeners
function initializeEventListeners() {
  // Sign up form handler
  const signUpForm = document.getElementById("signUpForm")
  if (signUpForm) {
    signUpForm.addEventListener("submit", handleSignUp)
  }

  // Login form handler
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Reservation form handler
  const reservationForm = document.getElementById("reservationForm")
  if (reservationForm) {
    reservationForm.addEventListener("submit", handleReservation)
  }

  // Close modals when clicking outside
  window.addEventListener("click", handleModalClick)
}

// Check if user is logged in
function checkLoginStatus() {
  const savedUser = localStorage.getItem("havenCurrentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    updateUserInterface()
  }
}

// Update UI based on login status
function updateUserInterface() {
  const userStatus = document.getElementById("userStatus")
  const myAccountLink = document.getElementById("myAccountLink")
  const logoutLink = document.getElementById("logoutLink")

  if (currentUser) {
    userStatus.textContent = `Welcome, ${currentUser.name}`
    userStatus.style.display = "block"
    myAccountLink.style.display = "block"
    logoutLink.style.display = "block"
  } else {
    userStatus.style.display = "none"
    myAccountLink.style.display = "none"
    logoutLink.style.display = "none"
  }
}

// Show different sections
function showSection(sectionName) {
  const sections = ["home", "about", "menu"]
  sections.forEach((section) => {
    const element = document.getElementById(section)
    if (element) {
      if (section === sectionName) {
        element.classList.remove("hidden")
      } else {
        element.classList.add("hidden")
      }
    }
  })
}

// Modal functions
function showSignIn() {
  document.getElementById("signInModal").style.display = "block"
}

function showLogin() {
  document.getElementById("loginModal").style.display = "block"
}

// Enhanced closeModal function to handle dynamic modals
function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"

    // Remove dynamically created modals
    if (modalId === "reservationListModal" || modalId === "editReservationModal" || modalId === "cancellationModal") {
      modal.remove()
    }
  }
}

// Handle sign up form submission
function handleSignUp(e) {
  e.preventDefault()

  const name = document.getElementById("signUpName").value
  const email = document.getElementById("signUpEmail").value
  const phone = document.getElementById("signUpPhone").value
  const password = document.getElementById("signUpPassword").value

  // Validate input
  if (!name || !email || !phone || !password) {
    alert("Please fill in all fields.")
    return
  }

  // Check if user already exists
  if (users.find((user) => user.email === email)) {
    alert("An account with this email already exists. Please login instead.")
    return
  }

  // Create new user
  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    phone: phone,
    password: password,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  localStorage.setItem("havenUsers", JSON.stringify(users))

  // Auto login
  currentUser = newUser
  localStorage.setItem("havenCurrentUser", JSON.stringify(currentUser))

  updateUserInterface()
  closeModal("signInModal")
  alert("Account created successfully! You are now logged in.")

  // Reset form
  document.getElementById("signUpForm").reset()
}

// Handle login form submission
function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  // Validate input
  if (!email || !password) {
    alert("Please fill in all fields.")
    return
  }

  const user = users.find((u) => u.email === email && u.password === password)

  if (user) {
    currentUser = user
    localStorage.setItem("havenCurrentUser", JSON.stringify(currentUser))
    updateUserInterface()
    closeModal("loginModal")
    alert("Login successful!")
    document.getElementById("loginForm").reset()
  } else {
    alert("Invalid email or password. Please try again.")
  }
}

// Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    currentUser = null
    localStorage.removeItem("havenCurrentUser")
    updateUserInterface()
    showSection("home")
    alert("You have been logged out.")
  }
}

// Reservation functions
function makeReservation() {
  if (!currentUser) {
    alert("Please create an account or login to make a reservation.")
    showSignIn()
    return
  }

  // Reset reservation flow
  selectedMenuItems = []
  currentReservationStep = 1
  showMenuSelectionModal()
}

// View user reservations
function viewReservations() {
  if (!currentUser) {
    alert("Please login to view your reservations.")
    showLogin()
    return
  }

  const userReservations = reservations.filter((r) => r.userId === currentUser.id)

  if (userReservations.length === 0) {
    alert("You have no reservations yet. Would you like to make one?")
    return
  }

  let reservationList = "<h3>Your Reservations:</h3>"
  userReservations.forEach((reservation) => {
    const menuItemsHtml = reservation.menuItems
      ? `<div class="reservation-menu-items">
        <strong>Selected Menu:</strong>
        <ul class="menu-items-list">
          ${reservation.menuItems.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
        </ul>
        <div class="food-total"><strong>Food Total: $${reservation.foodTotal || 0}</strong></div>
      </div>`
      : ""

    const statusClass = reservation.status === "cancelled" ? "cancelled" : "confirmed"
    const statusColor = reservation.status === "cancelled" ? "#ef4444" : "#10b981"

    reservationList += `
      <div style="border: 1px solid #e5e7eb; padding: 1rem; margin: 1rem 0; border-radius: 5px; background: #f8fafc; ${reservation.status === "cancelled" ? "opacity: 0.7;" : ""}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong style="color: #1e40af;">Reservation #${reservation.id}</strong>
          <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">${reservation.status.toUpperCase()}</span>
        </div>
        <strong>Date:</strong> ${formatDate(reservation.date)}<br>
        <strong>Time:</strong> ${formatTime(reservation.time)}<br>
        <strong>Party Size:</strong> ${reservation.partySize} ${reservation.partySize === "1" ? "person" : "people"}<br>
        ${menuItemsHtml}
        ${reservation.specialRequests ? `<strong>Special Requests:</strong> ${reservation.specialRequests}<br>` : ""}
        ${
          reservation.status === "cancelled"
            ? `<div style="color: #ef4444; font-weight: 500; margin-top: 0.5rem;">
          <strong>Cancelled on:</strong> ${formatDateTime(reservation.cancelledAt)}<br>
          ${reservation.cancellationReason ? `<strong>Reason:</strong> ${reservation.cancellationReason}<br>` : ""}
        </div>`
            : ""
        }
        <small style="color: #6b7280;">Booked on: ${formatDateTime(reservation.createdAt)}</small>
      </div>
    `
  })

  document.getElementById("userReservations").innerHTML = reservationList
  document.getElementById("myAccountModal").style.display = "block"
}

// Edit reservation function - now fully functional
function editReservation() {
  if (!currentUser) {
    alert("Please login to edit your reservations.")
    showLogin()
    return
  }

  const userReservations = reservations.filter((r) => r.userId === currentUser.id && r.status !== "cancelled")

  if (userReservations.length === 0) {
    alert("You have no active reservations to edit.")
    return
  }

  showReservationListModal(userReservations)
}

// Show list of reservations to edit
function showReservationListModal(userReservations) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reservationListModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reservationListModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Select Reservation to Edit</h2>
        <button class="modal-close" onclick="closeModal('reservationListModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reservation-list">
          ${userReservations
            .map(
              (reservation) => `
            <div class="reservation-card" onclick="editSpecificReservation(${reservation.id})">
              <div class="reservation-header">
                <span class="reservation-id">Reservation #${reservation.id}</span>
                <span class="reservation-status ${reservation.status}">${reservation.status.toUpperCase()}</span>
              </div>
              <div class="reservation-details">
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formatDate(reservation.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${formatTime(reservation.time)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Party Size:</span>
                  <span class="detail-value">${reservation.partySize} ${reservation.partySize === "1" ? "person" : "people"}</span>
                </div>
                ${
                  reservation.menuItems
                    ? `
                  <div class="detail-row">
                    <span class="detail-label">Menu Items:</span>
                    <span class="detail-value">${reservation.menuItems.length} items ($${reservation.foodTotal})</span>
                  </div>
                `
                    : ""
                }
              </div>
              <div class="edit-indicator">
                <span>Click to edit →</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

// Edit specific reservation
function editSpecificReservation(reservationId) {
  closeModal("reservationListModal")

  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  // Set up editing state
  currentEditingReservation = reservation
  selectedMenuItems = reservation.menuItems ? [...reservation.menuItems] : []

  showEditReservationModal(reservation)
}

// Show edit reservation modal
function showEditReservationModal(reservation) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "editReservationModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('editReservationModal')"></div>
    <div class="modal-content extra-large">
      <div class="modal-header">
        <h2>Edit Reservation #${reservation.id}</h2>
        <p class="modal-subtitle">Modify your reservation details</p>
        <button class="modal-close" onclick="closeModal('editReservationModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="edit-tabs">
          <button class="tab-button active" onclick="showEditTab('menu')">Menu Items</button>
          <button class="tab-button" onclick="showEditTab('details')">Reservation Details</button>
        </div>
        
        <div id="editMenuTab" class="edit-tab-content active">
          <div class="current-selection-summary">
            <h4>Current Menu Selection:</h4>
            <div id="currentMenuItems"></div>
            <div class="current-total">
              <strong>Current Total: $<span id="currentTotal">${reservation.foodTotal || 0}</span></strong>
            </div>
          </div>
          <div id="editMenuContainer"></div>
        </div>
        
        <div id="editDetailsTab" class="edit-tab-content">
          <form id="editReservationForm">
            <div class="form-row">
              <div class="form-group">
                <label for="editReservationDate">Date</label>
                <input type="date" id="editReservationDate" value="${reservation.date}" required class="form-input">
              </div>
              <div class="form-group">
                <label for="editReservationTime">Time</label>
                <select id="editReservationTime" required class="form-input">
                  <option value="">Select Time</option>
                  <option value="17:00" ${reservation.time === "17:00" ? "selected" : ""}>5:00 PM</option>
                  <option value="17:30" ${reservation.time === "17:30" ? "selected" : ""}>5:30 PM</option>
                  <option value="18:00" ${reservation.time === "18:00" ? "selected" : ""}>6:00 PM</option>
                  <option value="18:30" ${reservation.time === "18:30" ? "selected" : ""}>6:30 PM</option>
                  <option value="19:00" ${reservation.time === "19:00" ? "selected" : ""}>7:00 PM</option>
                  <option value="19:30" ${reservation.time === "19:30" ? "selected" : ""}>7:30 PM</option>
                  <option value="20:00" ${reservation.time === "20:00" ? "selected" : ""}>8:00 PM</option>
                  <option value="20:30" ${reservation.time === "20:30" ? "selected" : ""}>8:30 PM</option>
                  <option value="21:00" ${reservation.time === "21:00" ? "selected" : ""}>9:00 PM</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="editPartySize">Party Size</label>
              <select id="editPartySize" required class="form-input">
                <option value="">Select Party Size</option>
                <option value="1" ${reservation.partySize === "1" ? "selected" : ""}>1 Person</option>
                <option value="2" ${reservation.partySize === "2" ? "selected" : ""}>2 People</option>
                <option value="3" ${reservation.partySize === "3" ? "selected" : ""}>3 People</option>
                <option value="4" ${reservation.partySize === "4" ? "selected" : ""}>4 People</option>
                <option value="5" ${reservation.partySize === "5" ? "selected" : ""}>5 People</option>
                <option value="6" ${reservation.partySize === "6" ? "selected" : ""}>6 People</option>
                <option value="7" ${reservation.partySize === "7" ? "selected" : ""}>7 People</option>
                <option value="8" ${reservation.partySize === "8" ? "selected" : ""}>8 People</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editSpecialRequests">Special Requests</label>
              <textarea id="editSpecialRequests" rows="3" placeholder="Any dietary restrictions or special occasions?" class="form-input">${reservation.specialRequests || ""}</textarea>
            </div>
          </form>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-danger" onclick="showCancellationModal(${reservation.id})">Cancel Reservation</button>
          <div class="action-buttons">
            <button type="button" class="btn btn-secondary" onclick="closeModal('editReservationModal')">Close</button>
            <button type="button" class="btn btn-primary" onclick="saveReservationChanges(${reservation.id})">
              <span>Save Changes</span>
              <span class="button-arrow">✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("editReservationDate").min = today

  // Initialize the edit interface
  renderEditMenuSelection()
  updateCurrentMenuDisplay()
}

// Show cancellation modal with options and reasons
function showCancellationModal(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  // Calculate hours until reservation
  const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`)
  const now = new Date()
  const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60)

  // Determine cancellation policy
  let cancellationPolicy = ""
  let refundAmount = 0
  let canCancel = true

  if (hoursUntilReservation < 2) {
    cancellationPolicy = "⚠️ Less than 2 hours notice - No refund available"
    refundAmount = 0
  } else if (hoursUntilReservation < 24) {
    cancellationPolicy = "⏰ Less than 24 hours notice - 50% refund"
    refundAmount = Math.round((reservation.foodTotal || 0) * 0.5)
  } else {
    cancellationPolicy = "✅ More than 24 hours notice - Full refund"
    refundAmount = reservation.foodTotal || 0
  }

  if (hoursUntilReservation < 0) {
    cancellationPolicy = "❌ Cannot cancel past reservations"
    canCancel = false
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "cancellationModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('cancellationModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Cancel Reservation #${reservation.id}</h2>
        <p class="modal-subtitle">Please review the cancellation details</p>
        <button class="modal-close" onclick="closeModal('cancellationModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="cancellation-details">
          <div class="reservation-summary">
            <h4>Reservation Details:</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Date:</span>
                <span class="summary-value">${formatDate(reservation.date)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Time:</span>
                <span class="summary-value">${formatTime(reservation.time)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Party Size:</span>
                <span class="summary-value">${reservation.partySize} ${reservation.partySize === "1" ? "person" : "people"}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Food Total:</span>
                <span class="summary-value">$${reservation.foodTotal || 0}</span>
              </div>
            </div>
          </div>

          <div class="cancellation-policy">
            <h4>Cancellation Policy:</h4>
            <div class="policy-info">
              <p class="policy-text">${cancellationPolicy}</p>
              ${
                refundAmount > 0
                  ? `<div class="refund-info">
                <span class="refund-label">Refund Amount:</span>
                <span class="refund-amount">$${refundAmount}</span>
              </div>`
                  : ""
              }
            </div>
          </div>

          ${
            canCancel
              ? `
          <div class="cancellation-reason">
            <h4>Reason for Cancellation:</h4>
            <div class="reason-options">
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Schedule conflict" checked>
                <span>Schedule conflict</span>
              </label>
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Emergency">
                <span>Emergency</span>
              </label>
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Illness">
                <span>Illness</span>
              </label>
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Change of plans">
                <span>Change of plans</span>
              </label>
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Weather concerns">
                <span>Weather concerns</span>
              </label>
              <label class="reason-option">
                <input type="radio" name="cancellationReason" value="Other">
                <span>Other</span>
              </label>
            </div>
            <div class="other-reason" style="display: none;">
              <label for="otherReasonText">Please specify:</label>
              <textarea id="otherReasonText" rows="2" placeholder="Please provide details..." class="form-input"></textarea>
            </div>
          </div>

          <div class="cancellation-confirmation">
            <label class="confirmation-checkbox">
              <input type="checkbox" id="confirmCancellation">
              <span>I understand the cancellation policy and confirm that I want to cancel this reservation</span>
            </label>
          </div>
          `
              : `
          <div class="cancellation-blocked">
            <p class="blocked-message">This reservation cannot be cancelled at this time. Please contact the restaurant directly at (555) 123-4567 for assistance.</p>
          </div>
          `
          }
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal('cancellationModal')">Keep Reservation</button>
          ${
            canCancel
              ? `
          <button type="button" class="btn btn-danger" onclick="confirmCancellation(${reservation.id})" id="cancelButton" disabled>
            <span>Cancel Reservation</span>
            <span class="button-arrow">✗</span>
          </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"

  if (canCancel) {
    // Add event listeners for the cancellation form
    setupCancellationListeners()
  }
}

// Setup event listeners for cancellation modal
function setupCancellationListeners() {
  // Handle "Other" reason selection
  const reasonRadios = document.querySelectorAll('input[name="cancellationReason"]')
  const otherReasonDiv = document.querySelector(".other-reason")

  reasonRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "Other") {
        otherReasonDiv.style.display = "block"
      } else {
        otherReasonDiv.style.display = "none"
      }
    })
  })

  // Handle confirmation checkbox
  const confirmCheckbox = document.getElementById("confirmCancellation")
  const cancelButton = document.getElementById("cancelButton")

  confirmCheckbox.addEventListener("change", function () {
    cancelButton.disabled = !this.checked
  })
}

// Confirm cancellation with reason
function confirmCancellation(reservationId) {
  const selectedReason = document.querySelector('input[name="cancellationReason"]:checked')
  const otherReasonText = document.getElementById("otherReasonText")
  const confirmCheckbox = document.getElementById("confirmCancellation")

  if (!selectedReason) {
    alert("Please select a reason for cancellation.")
    return
  }

  if (!confirmCheckbox.checked) {
    alert("Please confirm that you understand the cancellation policy.")
    return
  }

  let cancellationReason = selectedReason.value
  if (cancellationReason === "Other" && otherReasonText.value.trim()) {
    cancellationReason = `Other: ${otherReasonText.value.trim()}`
  }

  // Find and update the reservation
  const reservationIndex = reservations.findIndex((r) => r.id === reservationId)
  if (reservationIndex === -1) {
    alert("Reservation not found.")
    return
  }

  const reservation = reservations[reservationIndex]

  // Calculate refund amount
  const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`)
  const now = new Date()
  const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60)

  let refundAmount = 0
  if (hoursUntilReservation >= 24) {
    refundAmount = reservation.foodTotal || 0
  } else if (hoursUntilReservation >= 2) {
    refundAmount = Math.round((reservation.foodTotal || 0) * 0.5)
  }

  // Update reservation status
  reservations[reservationIndex] = {
    ...reservation,
    status: "cancelled",
    cancellationReason: cancellationReason,
    cancelledAt: new Date().toISOString(),
    refundAmount: refundAmount,
    cancelledBy: currentUser.id,
  }

  // Save to localStorage
  localStorage.setItem("havenReservations", JSON.stringify(reservations))

  // Close modals
  closeModal("cancellationModal")
  closeModal("editReservationModal")

  // Show confirmation message
  let confirmationMessage = `Reservation #${reservationId} has been cancelled successfully.`

  if (refundAmount > 0) {
    confirmationMessage += `\n\nRefund Amount: $${refundAmount}`
    confirmationMessage += `\nRefund will be processed within 3-5 business days.`
  }

  confirmationMessage += `\n\nReason: ${cancellationReason}`
  confirmationMessage += `\n\nWe're sorry to see you go! We hope to serve you again in the future.`

  alert(confirmationMessage)

  // Reset editing state
  currentEditingReservation = null
  selectedMenuItems = []
}

// Show different edit tabs
function showEditTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[onclick="showEditTab('${tabName}')"]`).classList.add("active")

  // Update tab content
  document.querySelectorAll(".edit-tab-content").forEach((content) => content.classList.remove("active"))
  document.getElementById(`edit${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add("active")
}

// Render menu selection for editing
function renderEditMenuSelection() {
  const menuContainer = document.getElementById("editMenuContainer")

  const menuData = {
    appetizers: [
      { name: "Seared Scallops", description: "Pan-seared scallops with cauliflower purée and pancetta", price: 18 },
      { name: "Tuna Tartare", description: "Fresh tuna with avocado, citrus, and sesame", price: 16 },
      { name: "Burrata", description: "Creamy burrata with heirloom tomatoes and basil oil", price: 14 },
    ],
    mains: [
      {
        name: "Wagyu Beef Tenderloin",
        description: "Grilled wagyu with truffle mashed potatoes and red wine jus",
        price: 65,
        featured: true,
      },
      { name: "Atlantic Salmon", description: "Cedar plank salmon with quinoa and seasonal vegetables", price: 32 },
      { name: "Duck Confit", description: "Slow-cooked duck leg with cherry gastrique and wild rice", price: 38 },
    ],
    desserts: [
      { name: "Chocolate Soufflé", description: "Warm chocolate soufflé with vanilla bean ice cream", price: 12 },
      { name: "Crème Brûlée", description: "Classic vanilla crème brûlée with fresh berries", price: 10 },
      { name: "Tiramisu", description: "House-made tiramisu with espresso and mascarpone", price: 11 },
    ],
  }

  let html = '<div class="menu-selection-content"><h4>Update Your Menu Selection:</h4>'

  Object.entries(menuData).forEach(([category, items]) => {
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1)
    html += `
      <div class="menu-selection-category">
        <h3 class="menu-category-title">${categoryTitle}</h3>
        <div class="menu-selection-items">
    `

    items.forEach((item, index) => {
      const itemId = `${category}-${index}`
      const isSelected = selectedMenuItems.some((selected) => selected.id === itemId)

      html += `
        <div class="menu-selection-item ${isSelected ? "selected" : ""}" onclick="toggleEditMenuItem('${itemId}', '${item.name}', '${item.description}', ${item.price})">
          <div class="menu-item-info">
            <div class="menu-item-header">
              <span class="menu-item-name">${item.name}</span>
              ${item.featured ? '<span class="chef-special">Chef\'s Special</span>' : ""}
              <span class="menu-item-price">$${item.price}</span>
            </div>
            <p class="menu-item-description">${item.description}</p>
          </div>
          <div class="menu-item-selector">
            <span class="selection-indicator">${isSelected ? "✓" : "+"}</span>
          </div>
        </div>
      `
    })

    html += "</div></div>"
  })

  html += "</div>"
  menuContainer.innerHTML = html
}

// Toggle menu item in edit mode
function toggleEditMenuItem(id, name, description, price) {
  const existingIndex = selectedMenuItems.findIndex((item) => item.id === id)

  if (existingIndex > -1) {
    selectedMenuItems.splice(existingIndex, 1)
  } else {
    selectedMenuItems.push({ id, name, description, price })
  }

  renderEditMenuSelection()
  updateCurrentMenuDisplay()
}

// Update current menu display
function updateCurrentMenuDisplay() {
  const container = document.getElementById("currentMenuItems")
  const totalElement = document.getElementById("currentTotal")

  if (selectedMenuItems.length === 0) {
    container.innerHTML = '<p class="no-items">No items selected</p>'
  } else {
    container.innerHTML = selectedMenuItems
      .map(
        (item) => `
      <div class="selected-item">
        <span class="selected-item-name">${item.name}</span>
        <span class="selected-item-price">$${item.price}</span>
        <button class="remove-item" onclick="toggleEditMenuItem('${item.id}', '${item.name}', '${item.description}', ${item.price})" title="Remove item">×</button>
      </div>
    `,
      )
      .join("")
  }

  if (totalElement) {
    totalElement.textContent = calculateTotal()
  }
}

// Save reservation changes
function saveReservationChanges(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  // Get form values
  const date = document.getElementById("editReservationDate").value
  const time = document.getElementById("editReservationTime").value
  const partySize = document.getElementById("editPartySize").value
  const specialRequests = document.getElementById("editSpecialRequests").value

  // Validate required fields
  if (!date || !time || !partySize) {
    alert("Please fill in all required fields.")
    return
  }

  // Validate date is not in the past
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    alert("Please select a future date for your reservation.")
    return
  }

  // Validate menu selection
  if (selectedMenuItems.length === 0) {
    alert("Please select at least one menu item.")
    return
  }

  // Update reservation
  const reservationIndex = reservations.findIndex((r) => r.id === reservationId)
  reservations[reservationIndex] = {
    ...reservation,
    date: date,
    time: time,
    partySize: partySize,
    specialRequests: specialRequests,
    menuItems: [...selectedMenuItems],
    foodTotal: calculateTotal(),
    lastModified: new Date().toISOString(),
  }

  // Save to localStorage
  localStorage.setItem("havenReservations", JSON.stringify(reservations))

  closeModal("editReservationModal")

  // Show success message
  const menuSummary = selectedMenuItems.map((item) => `• ${item.name} - $${item.price}`).join("\n")
  alert(
    `Reservation updated successfully!\n\nUpdated Details:\nDate: ${formatDate(date)}\nTime: ${formatTime(time)}\nParty Size: ${partySize} people\n\nUpdated Menu:\n${menuSummary}\n\nNew Food Total: $${calculateTotal()}`,
  )

  // Reset editing state
  currentEditingReservation = null
  selectedMenuItems = []
}

// Legacy cancel reservation function (kept for compatibility)
function cancelReservation(reservationId) {
  showCancellationModal(reservationId)
}

// Show my account information
function showMyAccount() {
  if (!currentUser) {
    alert("Please login to view your account.")
    showLogin()
    return
  }

  const accountInfo = `
    <h3>Account Information:</h3>
    <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #e2e8f0;">
      <div style="margin-bottom: 0.75rem;"><strong>Name:</strong> ${currentUser.name}</div>
      <div style="margin-bottom: 0.75rem;"><strong>Email:</strong> ${currentUser.email}</div>
      <div style="margin-bottom: 0.75rem;"><strong>Phone:</strong> ${currentUser.phone}</div>
      <div><strong>Member Since:</strong> ${formatDateTime(currentUser.createdAt)}</div>
    </div>
  `

  document.getElementById("accountInfo").innerHTML = accountInfo

  const userReservations = reservations.filter((r) => r.userId === currentUser.id)
  let reservationList = "<h3>Recent Reservations:</h3>"

  if (userReservations.length === 0) {
    reservationList +=
      '<p style="color: #6b7280; font-style: italic;">No reservations found. <a href="#" onclick="closeModal(\'myAccountModal\'); makeReservation();" style="color: #3b82f6;">Make your first reservation!</a></p>'
  } else {
    // Show only the 3 most recent reservations
    const recentReservations = userReservations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)

    recentReservations.forEach((reservation) => {
      const menuItemsHtml = reservation.menuItems
        ? `<div class="reservation-menu-items" style="margin-top: 0.5rem;">
          <strong>Menu Items:</strong>
          <ul style="margin: 0.25rem 0; padding-left: 1rem; font-size: 0.9rem;">
            ${reservation.menuItems.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
          </ul>
          <div style="font-size: 0.9rem; color: #1e40af;"><strong>Food Total: $${reservation.foodTotal || 0}</strong></div>
        </div>`
        : ""

      const statusColor = reservation.status === "cancelled" ? "#ef4444" : "#10b981"

      reservationList += `
        <div style="border: 1px solid #e5e7eb; padding: 1rem; margin: 1rem 0; border-radius: 5px; background: #f8fafc; ${reservation.status === "cancelled" ? "opacity: 0.7;" : ""}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #1e40af;">Reservation #${reservation.id}</strong>
            <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">${reservation.status.toUpperCase()}</span>
          </div>
          <strong>Date:</strong> ${formatDate(reservation.date)}<br>
          <strong>Time:</strong> ${formatTime(reservation.time)}<br>
          <strong>Party Size:</strong> ${reservation.partySize} ${reservation.partySize === "1" ? "person" : "people"}<br>
          ${menuItemsHtml}
          ${reservation.specialRequests ? `<strong>Special Requests:</strong> ${reservation.specialRequests}<br>` : ""}
          ${
            reservation.status === "cancelled"
              ? `<div style="color: #ef4444; font-weight: 500; margin-top: 0.5rem;">
            <strong>Cancelled:</strong> ${formatDateTime(reservation.cancelledAt)}<br>
            ${reservation.cancellationReason ? `<strong>Reason:</strong> ${reservation.cancellationReason}<br>` : ""}
            ${reservation.refundAmount > 0 ? `<strong>Refund:</strong> $${reservation.refundAmount}<br>` : ""}
          </div>`
              : ""
          }
        </div>
      `
    })

    if (userReservations.length > 3) {
      reservationList += `<p style="text-align: center; margin-top: 1rem;"><a href="#" onclick="closeModal('myAccountModal'); viewReservations();" style="color: #3b82f6;">View all ${userReservations.length} reservations</a></p>`
    }
  }

  document.getElementById("userReservations").innerHTML = reservationList
  document.getElementById("myAccountModal").style.display = "block"
}

// Handle modal clicks (close when clicking outside)
function handleModalClick(event) {
  const modals = [
    "signInModal",
    "loginModal",
    "reservationModal",
    "myAccountModal",
    "menuSelectionModal",
    "reservationListModal",
    "editReservationModal",
    "cancellationModal",
  ]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (modal && event.target === modal) {
      closeModal(modalId)
    }
  })
}

// Clean up function for edit reservation
function cleanupEditReservation() {
  currentEditingReservation = null
  selectedMenuItems = []

  // Remove any existing dynamic modals
  const existingModals = ["reservationListModal", "editReservationModal", "cancellationModal"]
  existingModals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.remove()
    }
  })
}

// Utility functions for formatting
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":")
  const date = new Date()
  date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Additional utility functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

// Add these new functions after the existing utility functions

// Menu selection functions
function showMenuSelectionModal() {
  document.getElementById("menuSelectionModal").style.display = "block"
  renderMenuSelection()
}

function renderMenuSelection() {
  const menuContainer = document.getElementById("menuSelectionContainer")

  const menuData = {
    appetizers: [
      { name: "Seared Scallops", description: "Pan-seared scallops with cauliflower purée and pancetta", price: 18 },
      { name: "Tuna Tartare", description: "Fresh tuna with avocado, citrus, and sesame", price: 16 },
      { name: "Burrata", description: "Creamy burrata with heirloom tomatoes and basil oil", price: 14 },
    ],
    mains: [
      {
        name: "Wagyu Beef Tenderloin",
        description: "Grilled wagyu with truffle mashed potatoes and red wine jus",
        price: 65,
        featured: true,
      },
      { name: "Atlantic Salmon", description: "Cedar plank salmon with quinoa and seasonal vegetables", price: 32 },
      { name: "Duck Confit", description: "Slow-cooked duck leg with cherry gastrique and wild rice", price: 38 },
    ],
    desserts: [
      { name: "Chocolate Soufflé", description: "Warm chocolate soufflé with vanilla bean ice cream", price: 12 },
      { name: "Crème Brûlée", description: "Classic vanilla crème brûlée with fresh berries", price: 10 },
      { name: "Tiramisu", description: "House-made tiramisu with espresso and mascarpone", price: 11 },
    ],
  }

  let html = '<div class="menu-selection-content">'

  Object.entries(menuData).forEach(([category, items]) => {
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1)
    html += `
      <div class="menu-selection-category">
        <h3 class="menu-category-title">${categoryTitle}</h3>
        <div class="menu-selection-items">
    `

    items.forEach((item, index) => {
      const itemId = `${category}-${index}`
      const isSelected = selectedMenuItems.some((selected) => selected.id === itemId)

      html += `
        <div class="menu-selection-item ${isSelected ? "selected" : ""}" onclick="toggleMenuItem('${itemId}', '${item.name}', '${item.description}', ${item.price})">
          <div class="menu-item-info">
            <div class="menu-item-header">
              <span class="menu-item-name">${item.name}</span>
              ${item.featured ? '<span class="chef-special">Chef\'s Special</span>' : ""}
              <span class="menu-item-price">$${item.price}</span>
            </div>
            <p class="menu-item-description">${item.description}</p>
          </div>
          <div class="menu-item-selector">
            <span class="selection-indicator">${isSelected ? "✓" : "+"}</span>
          </div>
        </div>
      `
    })

    html += "</div></div>"
  })

  html += "</div>"
  html += `
    <div class="menu-selection-summary">
      <div class="selected-items-container">
        <h4>Selected Items (<span id="selectedCount">${selectedMenuItems.length}</span>)</h4>
        <div id="selectedItemsList" class="selected-items-list">
          ${renderSelectedItems()}
        </div>
        <div class="total-price">
          <strong>Total: $<span id="totalPrice">${calculateTotal()}</span></strong>
        </div>
      </div>
    </div>
  `

  menuContainer.innerHTML = html
}

function toggleMenuItem(id, name, description, price) {
  const existingIndex = selectedMenuItems.findIndex((item) => item.id === id)

  if (existingIndex > -1) {
    // Remove item
    selectedMenuItems.splice(existingIndex, 1)
  } else {
    // Add item
    selectedMenuItems.push({ id, name, description, price })
  }

  renderMenuSelection()
}

function renderSelectedItems() {
  if (selectedMenuItems.length === 0) {
    return '<p class="no-items">No items selected yet</p>'
  }

  return selectedMenuItems
    .map(
      (item) => `
    <div class="selected-item">
      <span class="selected-item-name">${item.name}</span>
      <span class="selected-item-price">$${item.price}</span>
      <button class="remove-item" onclick="toggleMenuItem('${item.id}', '${item.name}', '${item.description}', ${item.price})" title="Remove item">×</button>
    </div>
  `,
    )
    .join("")
}

function calculateTotal() {
  return selectedMenuItems.reduce((total, item) => total + item.price, 0)
}

function proceedToTableSelection() {
  if (selectedMenuItems.length === 0) {
    alert("Please select at least one menu item before proceeding.")
    return
  }

  closeModal("menuSelectionModal")
  currentReservationStep = 2
  document.getElementById("reservationModal").style.display = "block"

  // Update reservation modal to show selected items
  updateReservationSummary()
}

function updateReservationSummary() {
  const summaryContainer = document.getElementById("reservationSummary")
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="reservation-menu-summary">
        <h4>Selected Menu Items:</h4>
        <div class="summary-items">
          ${selectedMenuItems
            .map(
              (item) => `
            <div class="summary-item">
              <span>${item.name}</span>
              <span>$${item.price}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="summary-total">
          <strong>Food Total: $${calculateTotal()}</strong>
        </div>
      </div>
    `
  }
}

// Update the handleReservation function to include menu items
function handleReservation(e) {
  e.preventDefault()

  if (!currentUser) {
    alert("Please login to make a reservation.")
    return
  }

  if (selectedMenuItems.length === 0) {
    alert("Please select menu items first.")
    makeReservation() // Restart the process
    return
  }

  const date = document.getElementById("reservationDate").value
  const time = document.getElementById("reservationTime").value
  const partySize = document.getElementById("partySize").value
  const specialRequests = document.getElementById("specialRequests").value

  // Validate input
  if (!date || !time || !partySize) {
    alert("Please fill in all required fields.")
    return
  }

  // Check if date is not in the past
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    alert("Please select a future date for your reservation.")
    return
  }

  const reservation = {
    id: Date.now(),
    userId: currentUser.id,
    userName: currentUser.name,
    userEmail: currentUser.email,
    userPhone: currentUser.phone,
    date: date,
    time: time,
    partySize: partySize,
    specialRequests: specialRequests,
    menuItems: [...selectedMenuItems], // Include selected menu items
    foodTotal: calculateTotal(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  }

  reservations.push(reservation)
  localStorage.setItem("havenReservations", JSON.stringify(reservations))

  closeModal("reservationModal")

  // Show confirmation with menu details
  const menuSummary = selectedMenuItems.map((item) => `• ${item.name} - $${item.price}`).join("\n")
  alert(
    `Reservation confirmed!\n\nDate: ${formatDate(date)}\nTime: ${formatTime(time)}\nParty Size: ${partySize} people\n\nSelected Menu:\n${menuSummary}\n\nFood Total: $${calculateTotal()}\n\nWe look forward to seeing you at Haven!`,
  )

  // Reset form and selection
  document.getElementById("reservationForm").reset()
  selectedMenuItems = []
  currentReservationStep = 1
}

// Export functions for global access (if needed)
window.showSection = showSection
window.makeReservation = makeReservation
window.viewReservations = viewReservations
window.editReservation = editReservation
window.showSignIn = showSignIn
window.showLogin = showLogin
window.showMyAccount = showMyAccount
window.logout = logout
window.closeModal = closeModal
