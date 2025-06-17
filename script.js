// User management variables
let currentUser = null
const users = JSON.parse(localStorage.getItem("havenUsers") || "[]")
const reservations = JSON.parse(localStorage.getItem("havenReservations") || "[]")
const payments = JSON.parse(localStorage.getItem("havenPayments") || "[]")

// Add these new variables at the top with other global variables
let selectedMenuItems = []
let selectedTable = null
let currentReservationStep = 1 // 1: Menu Selection, 2: Table Selection, 3: Reservation Details, 4: Payment

// Add this variable at the top with other global variables
const currentEditingReservation = null

// Table data with minimum charges
const tableData = [
  { id: 1, name: "Table 1", capacity: 2, minCharge: 50, location: "Window Side" },
  { id: 2, name: "Table 2", capacity: 4, minCharge: 80, location: "Center" },
  { id: 3, name: "Table 3", capacity: 6, minCharge: 120, location: "Private Corner" },
  { id: 4, name: "Table 4", capacity: 8, minCharge: 160, location: "VIP Section" },
  { id: 5, name: "Table 5", capacity: 2, minCharge: 55, location: "Garden View" },
  { id: 6, name: "Table 6", capacity: 4, minCharge: 85, location: "Terrace" },
  { id: 7, name: "Table 7", capacity: 10, minCharge: 200, location: "Private Dining" },
  { id: 8, name: "Table 8", capacity: 6, minCharge: 125, location: "Wine Cellar View" },
]

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus()
  setMinDate()
  initializeEventListeners()
  startPaymentExpiryChecker()
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

  // Payment form handler
  const paymentForm = document.getElementById("paymentForm")
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePaymentUpload)
  }

  // Close modals when clicking outside
  window.addEventListener("click", handleModalClick)
}

// Start payment expiry checker
function startPaymentExpiryChecker() {
  setInterval(checkPaymentExpiry, 60000) // Check every minute
}

// Check for expired payments
function checkPaymentExpiry() {
  const now = new Date()
  let hasExpired = false

  payments.forEach((payment) => {
    if (payment.status === "unpaid" && new Date(payment.expiryTime) < now) {
      payment.status = "expired"

      // Update reservation status
      const reservation = reservations.find((r) => r.id === payment.reservationId)
      if (reservation) {
        reservation.status = "expired"
        reservation.paymentStatus = "expired"
      }

      hasExpired = true
    }
  })

  if (hasExpired) {
    localStorage.setItem("havenPayments", JSON.stringify(payments))
    localStorage.setItem("havenReservations", JSON.stringify(reservations))
  }
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
  const adminLink = document.getElementById("adminLink")

  if (currentUser) {
    userStatus.textContent = `Welcome, ${currentUser.name}`
    userStatus.style.display = "block"
    myAccountLink.style.display = "block"
    logoutLink.style.display = "block"

    // Show admin link for admin users
    if (currentUser.role === "admin") {
      adminLink.style.display = "block"
    }
  } else {
    userStatus.style.display = "none"
    myAccountLink.style.display = "none"
    logoutLink.style.display = "none"
    adminLink.style.display = "none"
  }
}

// Show different sections
function showSection(sectionName) {
  const sections = ["home", "about", "menu", "admin"]
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
    if (
      modalId === "reservationListModal" ||
      modalId === "editReservationModal" ||
      modalId === "cancellationModal" ||
      modalId === "rescheduleModal"
    ) {
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
  const role = document.getElementById("signUpRole").value

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
    role: role,
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
  selectedTable = null
  currentReservationStep = 1
  showMenuSelectionModal()
}

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
  showTableSelectionModal()
}

// Table selection functions
function showTableSelectionModal() {
  document.getElementById("tableSelectionModal").style.display = "block"
  renderTableSelection()
}

function renderTableSelection() {
  const tableContainer = document.getElementById("tableSelectionContainer")

  let html = '<div class="table-selection-content">'
  html += "<h4>Available Tables:</h4>"
  html += '<div class="table-grid">'

  tableData.forEach((table) => {
    const isSelected = selectedTable && selectedTable.id === table.id

    html += `
      <div class="table-card ${isSelected ? "selected" : ""}" onclick="selectTable(${table.id})">
        <div class="table-header">
          <h5>${table.name}</h5>
          <span class="table-capacity">${table.capacity} seats</span>
        </div>
        <div class="table-details">
          <p class="table-location">${table.location}</p>
          <p class="table-min-charge">Min. Charge: <strong>$${table.minCharge}</strong></p>
        </div>
        <div class="table-selector">
          <span class="selection-indicator">${isSelected ? "✓" : "+"}</span>
        </div>
      </div>
    `
  })

  html += "</div>"

  if (selectedTable) {
    html += `
      <div class="table-selection-summary">
        <h4>Selected Table:</h4>
        <div class="selected-table-info">
          <p><strong>${selectedTable.name}</strong> - ${selectedTable.location}</p>
          <p>Capacity: ${selectedTable.capacity} people</p>
          <p>Minimum Charge: <strong>$${selectedTable.minCharge}</strong></p>
        </div>
      </div>
    `
  }

  html += "</div>"
  tableContainer.innerHTML = html
}

function selectTable(tableId) {
  selectedTable = tableData.find((table) => table.id === tableId)
  renderTableSelection()

  // Enable proceed button
  const proceedBtn = document.getElementById("proceedToDetailsBtn")
  if (proceedBtn) {
    proceedBtn.disabled = false
  }
}

function proceedToReservationDetails() {
  if (!selectedTable) {
    alert("Please select a table before proceeding.")
    return
  }

  closeModal("tableSelectionModal")
  currentReservationStep = 3
  document.getElementById("reservationModal").style.display = "block"
  updateReservationSummary()
}

function updateReservationSummary() {
  const summaryContainer = document.getElementById("reservationSummary")
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="reservation-complete-summary">
        <h4>Reservation Summary:</h4>
        
        <div class="summary-section">
          <h5>Selected Menu Items:</h5>
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
        
        <div class="summary-section">
          <h5>Selected Table:</h5>
          <div class="table-summary">
            <p><strong>${selectedTable.name}</strong> - ${selectedTable.location}</p>
            <p>Capacity: ${selectedTable.capacity} people</p>
            <p><strong>Minimum Charge: $${selectedTable.minCharge}</strong></p>
          </div>
        </div>
        
        <div class="summary-section total-summary">
          <div class="grand-total">
            <strong>Total Amount Due: $${Math.max(calculateTotal(), selectedTable.minCharge)}</strong>
          </div>
          <p class="payment-note">* You will pay the higher amount between food total and minimum charge</p>
        </div>
      </div>
    `
  }
}

// Handle reservation form submission
function handleReservation(e) {
  e.preventDefault()

  if (!currentUser) {
    alert("Please login to make a reservation.")
    return
  }

  if (selectedMenuItems.length === 0 || !selectedTable) {
    alert("Please complete menu and table selection first.")
    makeReservation() // Restart the process
    return
  }

  const date = document.getElementById("reservationDate").value
  const time = document.getElementById("reservationTime").value
  const specialRequests = document.getElementById("specialRequests").value

  // Validate input
  if (!date || !time) {
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

  // Check table availability
  const isTableAvailable = checkTableAvailability(selectedTable.id, date, time)
  if (!isTableAvailable) {
    alert("Selected table is not available at this time. Please choose a different time or table.")
    return
  }

  const totalAmount = Math.max(calculateTotal(), selectedTable.minCharge)

  const reservation = {
    id: Date.now(),
    userId: currentUser.id,
    userName: currentUser.name,
    userEmail: currentUser.email,
    userPhone: currentUser.phone,
    date: date,
    time: time,
    tableId: selectedTable.id,
    tableName: selectedTable.name,
    tableCapacity: selectedTable.capacity,
    specialRequests: specialRequests,
    menuItems: [...selectedMenuItems],
    foodTotal: calculateTotal(),
    minCharge: selectedTable.minCharge,
    totalAmount: totalAmount,
    status: "pending", // pending, confirmed, cancelled, expired
    paymentStatus: "unpaid", // unpaid, paid, expired
    createdAt: new Date().toISOString(),
  }

  reservations.push(reservation)
  localStorage.setItem("havenReservations", JSON.stringify(reservations))

  // Create payment record
  const payment = {
    id: Date.now(),
    reservationId: reservation.id,
    userId: currentUser.id,
    amount: totalAmount,
    status: "unpaid", // unpaid, paid, expired
    createdAt: new Date().toISOString(),
    expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    paymentProof: null,
    verifiedBy: null,
    verifiedAt: null,
  }

  payments.push(payment)
  localStorage.setItem("havenPayments", JSON.stringify(payments))

  closeModal("reservationModal")

  // Show payment modal
  showPaymentModal(reservation, payment)

  // Reset form and selection
  document.getElementById("reservationForm").reset()
  selectedMenuItems = []
  selectedTable = null
  currentReservationStep = 1
}

// Check table availability
function checkTableAvailability(tableId, date, time) {
  const existingReservations = reservations.filter(
    (r) =>
      r.tableId === tableId &&
      r.date === date &&
      r.time === time &&
      (r.status === "confirmed" || r.status === "pending"),
  )
  return existingReservations.length === 0
}

// Show payment modal
function showPaymentModal(reservation, payment) {
  const modal = document.getElementById("paymentModal")
  const paymentDetails = document.getElementById("paymentDetails")

  const expiryTime = new Date(payment.expiryTime)

  paymentDetails.innerHTML = `
    <div class="payment-summary">
      <h4>Payment Details:</h4>
      <div class="payment-info">
        <div class="payment-row">
          <span>Reservation ID:</span>
          <span><strong>#${reservation.id}</strong></span>
        </div>
        <div class="payment-row">
          <span>Date & Time:</span>
          <span>${formatDate(reservation.date)} at ${formatTime(reservation.time)}</span>
        </div>
        <div class="payment-row">
          <span>Table:</span>
          <span>${reservation.tableName}</span>
        </div>
        <div class="payment-row">
          <span>Food Total:</span>
          <span>$${reservation.foodTotal}</span>
        </div>
        <div class="payment-row">
          <span>Minimum Charge:</span>
          <span>$${reservation.minCharge}</span>
        </div>
        <div class="payment-row total-row">
          <span>Amount to Pay:</span>
          <span><strong>$${payment.amount}</strong></span>
        </div>
      </div>
      <div class="payment-deadline">
        <p><strong>⏰ Payment Deadline:</strong> ${formatDateTime(expiryTime)}</p>
        <p class="deadline-warning">Payment must be completed within 2 hours or reservation will be cancelled.</p>
      </div>
    </div>
  `

  modal.style.display = "block"
}

// Handle payment upload
function handlePaymentUpload(e) {
  e.preventDefault()

  const fileInput = document.getElementById("paymentProof")
  const file = fileInput.files[0]

  if (!file) {
    alert("Please select a payment proof file.")
    return
  }

  // Simulate file upload (in real app, this would upload to server)
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Data = e.target.result

    // Find the most recent unpaid payment for this user
    const userPayment = payments.find((p) => p.userId === currentUser.id && p.status === "unpaid")

    if (userPayment) {
      userPayment.paymentProof = base64Data
      userPayment.uploadedAt = new Date().toISOString()
      localStorage.setItem("havenPayments", JSON.stringify(payments))

      closeModal("paymentModal")
      alert("Payment proof uploaded successfully! Admin will verify your payment within 1 hour.")
    } else {
      alert("No pending payment found.")
    }
  }

  reader.readAsDataURL(file)
}

// Admin functions
function showAdminPanel() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Access denied. Admin privileges required.")
    return
  }

  showSection("admin")
  showAdminTab("payments")
}

function showAdminTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".admin-tab-button").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add("active")

  // Update tab content
  document.querySelectorAll(".admin-tab-content").forEach((content) => content.classList.remove("active"))
  document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add("active")

  // Load content based on tab
  switch (tabName) {
    case "payments":
      loadPaymentVerifications()
      break
    case "reservations":
      loadAllReservations()
      break
    case "tables":
      loadTableManagement()
      break
  }
}

function loadPaymentVerifications() {
  const container = document.getElementById("paymentVerificationList")
  const pendingPayments = payments.filter((p) => p.paymentProof && p.status === "unpaid")

  if (pendingPayments.length === 0) {
    container.innerHTML = '<p class="no-data">No pending payment verifications.</p>'
    return
  }

  let html = '<div class="payment-verification-list">'

  pendingPayments.forEach((payment) => {
    const reservation = reservations.find((r) => r.id === payment.reservationId)
    const user = users.find((u) => u.id === payment.userId)

    if (reservation && user) {
      html += `
        <div class="payment-verification-card">
          <div class="verification-header">
            <h5>Payment #${payment.id}</h5>
            <span class="payment-amount">$${payment.amount}</span>
          </div>
          <div class="verification-details">
            <div class="detail-row">
              <span>Customer:</span>
              <span>${user.name} (${user.email})</span>
            </div>
            <div class="detail-row">
              <span>Reservation:</span>
              <span>#${reservation.id} - ${formatDate(reservation.date)} ${formatTime(reservation.time)}</span>
            </div>
            <div class="detail-row">
              <span>Table:</span>
              <span>${reservation.tableName}</span>
            </div>
            <div class="detail-row">
              <span>Uploaded:</span>
              <span>${formatDateTime(payment.uploadedAt)}</span>
            </div>
            <div class="detail-row">
              <span>Expires:</span>
              <span class="expiry-time">${formatDateTime(payment.expiryTime)}</span>
            </div>
          </div>
          <div class="payment-proof">
            <h6>Payment Proof:</h6>
            <img src="${payment.paymentProof}" alt="Payment Proof" class="proof-image" onclick="viewFullImage('${payment.paymentProof}')">
          </div>
          <div class="verification-actions">
            <button class="btn btn-success" onclick="approvePayment(${payment.id})">Approve Payment</button>
            <button class="btn btn-danger" onclick="rejectPayment(${payment.id})">Reject Payment</button>
          </div>
        </div>
      `
    }
  })

  html += "</div>"
  container.innerHTML = html
}

function approvePayment(paymentId) {
  if (!confirm("Are you sure you want to approve this payment?")) {
    return
  }

  const payment = payments.find((p) => p.id === paymentId)
  if (payment) {
    payment.status = "paid"
    payment.verifiedBy = currentUser.id
    payment.verifiedAt = new Date().toISOString()

    // Update reservation status
    const reservation = reservations.find((r) => r.id === payment.reservationId)
    if (reservation) {
      reservation.status = "confirmed"
      reservation.paymentStatus = "paid"
    }

    localStorage.setItem("havenPayments", JSON.stringify(payments))
    localStorage.setItem("havenReservations", JSON.stringify(reservations))

    alert("Payment approved successfully!")
    loadPaymentVerifications()
  }
}

function rejectPayment(paymentId) {
  const reason = prompt("Please provide a reason for rejection:")
  if (!reason) return

  const payment = payments.find((p) => p.id === paymentId)
  if (payment) {
    payment.rejectionReason = reason
    payment.rejectedBy = currentUser.id
    payment.rejectedAt = new Date().toISOString()

    localStorage.setItem("havenPayments", JSON.stringify(payments))

    alert("Payment rejected. Customer will be notified.")
    loadPaymentVerifications()
  }
}

function loadAllReservations() {
  const container = document.getElementById("allReservationsList")

  if (reservations.length === 0) {
    container.innerHTML = '<p class="no-data">No reservations found.</p>'
    return
  }

  let html = '<div class="all-reservations-list">'

  // Sort reservations by date (newest first)
  const sortedReservations = [...reservations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  sortedReservations.forEach((reservation) => {
    const user = users.find((u) => u.id === reservation.userId)
    const payment = payments.find((p) => p.reservationId === reservation.id)

    html += `
      <div class="admin-reservation-card">
        <div class="reservation-header">
          <h5>Reservation #${reservation.id}</h5>
          <div class="status-badges">
            <span class="status-badge ${reservation.status}">${reservation.status.toUpperCase()}</span>
            <span class="payment-badge ${reservation.paymentStatus}">${reservation.paymentStatus.toUpperCase()}</span>
          </div>
        </div>
        <div class="reservation-details">
          <div class="detail-row">
            <span>Customer:</span>
            <span>${user ? user.name : "Unknown"} (${user ? user.email : "N/A"})</span>
          </div>
          <div class="detail-row">
            <span>Date & Time:</span>
            <span>${formatDate(reservation.date)} at ${formatTime(reservation.time)}</span>
          </div>
          <div class="detail-row">
            <span>Table:</span>
            <span>${reservation.tableName} (${reservation.tableCapacity} seats)</span>
          </div>
          <div class="detail-row">
            <span>Total Amount:</span>
            <span>$${reservation.totalAmount}</span>
          </div>
          <div class="detail-row">
            <span>Created:</span>
            <span>${formatDateTime(reservation.createdAt)}</span>
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn btn-secondary" onclick="viewReservationDetails(${reservation.id})">View Details</button>
          ${
            reservation.status === "confirmed"
              ? `<button class="btn btn-danger" onclick="adminCancelReservation(${reservation.id})">Cancel</button>`
              : ""
          }
        </div>
      </div>
    `
  })

  html += "</div>"
  container.innerHTML = html
}

function loadTableManagement() {
  const container = document.getElementById("tableManagementList")

  let html = '<div class="table-management-list">'
  html += "<h4>Table Configuration:</h4>"

  tableData.forEach((table) => {
    // Get current reservations for this table
    const currentReservations = reservations.filter(
      (r) => r.tableId === table.id && (r.status === "confirmed" || r.status === "pending"),
    )

    html += `
      <div class="table-management-card">
        <div class="table-info">
          <h5>${table.name}</h5>
          <div class="table-specs">
            <span>Capacity: ${table.capacity} people</span>
            <span>Location: ${table.location}</span>
            <span>Min. Charge: $${table.minCharge}</span>
          </div>
        </div>
        <div class="table-status">
          <span class="reservation-count">${currentReservations.length} active reservations</span>
        </div>
      </div>
    `
  })

  html += "</div>"
  container.innerHTML = html
}

// Reschedule functionality
function rescheduleReservation() {
  if (!currentUser) {
    alert("Please login to reschedule reservations.")
    showLogin()
    return
  }

  const userReservations = reservations.filter(
    (r) => r.userId === currentUser.id && (r.status === "confirmed" || r.status === "pending"),
  )

  if (userReservations.length === 0) {
    alert("You have no active reservations to reschedule.")
    return
  }

  showRescheduleModal(userReservations)
}

function showRescheduleModal(userReservations) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reschedule Reservation</h2>
        <p class="modal-subtitle">Select a reservation to reschedule (must be at least 1 day before original date)</p>
        <button class="modal-close" onclick="closeModal('rescheduleModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reschedule-list">
          ${userReservations
            .filter((reservation) => {
              const reservationDate = new Date(reservation.date)
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              return reservationDate > tomorrow
            })
            .map(
              (reservation) => `
              <div class="reschedule-card" onclick="selectReservationToReschedule(${reservation.id})">
                <div class="reservation-header">
                  <span class="reservation-id">Reservation #${reservation.id}</span>
                  <span class="reservation-status ${reservation.status}">${reservation.status.toUpperCase()}</span>
                </div>
                <div class="reservation-details">
                  <div class="detail-row">
                    <span class="detail-label">Current Date:</span>
                    <span class="detail-value">${formatDate(reservation.date)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Current Time:</span>
                    <span class="detail-value">${formatTime(reservation.time)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Table:</span>
                    <span class="detail-value">${reservation.tableName}</span>
                  </div>
                </div>
                <div class="reschedule-indicator">
                  <span>Click to reschedule →</span>
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

function selectReservationToReschedule(reservationId) {
  closeModal("rescheduleModal")

  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  showRescheduleDetailsModal(reservation)
}

function showRescheduleDetailsModal(reservation) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleDetailsModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reschedule Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="current-reservation">
          <h4>Current Reservation:</h4>
          <p><strong>Date:</strong> ${formatDate(reservation.date)}</p>
          <p><strong>Time:</strong> ${formatTime(reservation.time)}</p>
          <p><strong>Table:</strong> ${reservation.tableName}</p>
        </div>
        
        <form id="rescheduleForm">
          <h4>New Date & Time:</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="newDate">New Date</label>
              <input type="date" id="newDate" required class="form-input">
            </div>
            <div class="form-group">
              <label for="newTime">New Time</label>
              <select id="newTime" required class="form-input">
                <option value="">Select Time</option>
                <option value="17:00">5:00 PM</option>
                <option value="17:30">5:30 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('rescheduleDetailsModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm Reschedule</button>
          </div>
        </form>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("newDate").min = today

  // Handle form submission
  document.getElementById("rescheduleForm").addEventListener("submit", (e) => {
    e.preventDefault()
    handleReschedule(reservation.id)
  })
}

function handleReschedule(reservationId) {
  const newDate = document.getElementById("newDate").value
  const newTime = document.getElementById("newTime").value

  if (!newDate || !newTime) {
    alert("Please fill in all fields.")
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  // Check if new date is at least tomorrow
  const selectedDate = new Date(newDate)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  if (selectedDate < tomorrow) {
    alert("Please select a date that is at least 1 day from today.")
    return
  }

  // Check table availability for new date/time
  const isAvailable = checkTableAvailability(reservation.tableId, newDate, newTime)
  if (!isAvailable) {
    alert("The table is not available at the selected time. Please choose a different time.")
    return
  }

  // Update reservation
  const reservationIndex = reservations.findIndex((r) => r.id === reservationId)
  reservations[reservationIndex] = {
    ...reservation,
    date: newDate,
    time: newTime,
    rescheduledAt: new Date().toISOString(),
    rescheduledBy: currentUser.id,
  }

  localStorage.setItem("havenReservations", JSON.stringify(reservations))

  closeModal("rescheduleDetailsModal")
  alert(`Reservation successfully rescheduled to ${formatDate(newDate)} at ${formatTime(newTime)}`)
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
    const payment = payments.find((p) => p.reservationId === reservation.id)
    const menuItemsHtml = reservation.menuItems
      ? `<div class="reservation-menu-items">
        <strong>Selected Menu:</strong>
        <ul class="menu-items-list">
          ${reservation.menuItems.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
        </ul>
        <div class="food-total"><strong>Food Total: $${reservation.foodTotal || 0}</strong></div>
      </div>`
      : ""

    const statusClass = reservation.status === "cancelled" ? "cancelled" : reservation.status
    const statusColor = getStatusColor(reservation.status)
    const paymentStatusColor = getStatusColor(reservation.paymentStatus)

    reservationList += `
      <div style="border: 1px solid #e5e7eb; padding: 1rem; margin: 1rem 0; border-radius: 5px; background: #f8fafc; ${reservation.status === "cancelled" ? "opacity: 0.7;" : ""}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong style="color: #1e40af;">Reservation #${reservation.id}</strong>
          <div>
            <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-right: 0.5rem;">${reservation.status.toUpperCase()}</span>
            <span style="background: ${paymentStatusColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem;">${reservation.paymentStatus.toUpperCase()}</span>
          </div>
        </div>
        <strong>Date:</strong> ${formatDate(reservation.date)}<br>
        <strong>Time:</strong> ${formatTime(reservation.time)}<br>
        <strong>Table:</strong> ${reservation.tableName} (${reservation.tableCapacity} seats)<br>
        <strong>Total Amount:</strong> $${reservation.totalAmount}<br>
        ${menuItemsHtml}
        ${reservation.specialRequests ? `<strong>Special Requests:</strong> ${reservation.specialRequests}<br>` : ""}
        ${
          payment && payment.expiryTime && reservation.paymentStatus === "unpaid"
            ? `<div style="color: #f59e0b; font-weight: 500; margin-top: 0.5rem;">
            <strong>Payment Deadline:</strong> ${formatDateTime(payment.expiryTime)}
          </div>`
            : ""
        }
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

function getStatusColor(status) {
  switch (status) {
    case "confirmed":
    case "paid":
      return "#10b981"
    case "pending":
    case "unpaid":
      return "#f59e0b"
    case "cancelled":
    case "expired":
      return "#ef4444"
    default:
      return "#6b7280"
  }
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
                  <span class="detail-label">Table:</span>
                  <span class="detail-value">${reservation.tableName}</span>
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
      <div style="margin-bottom: 0.75rem;"><strong>Role:</strong> ${currentUser.role}</div>
      <div><strong>Member Since:</strong> ${formatDateTime(currentUser.createdAt)}</div>
    </div>
  `

  document.getElementById("accountInfo").innerHTML = accountInfo
  viewReservations() // This will populate the reservations section
}

// Handle modal clicks (close when clicking outside)
function handleModalClick(event) {
  const modals = [
    "signInModal",
    "loginModal",
    "reservationModal",
    "myAccountModal",
    "menuSelectionModal",
    "tableSelectionModal",
    "paymentModal",
    "reservationListModal",
    "editReservationModal",
    "cancellationModal",
    "rescheduleModal",
    "rescheduleDetailsModal",
  ]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (modal && event.target === modal) {
      closeModal(modalId)
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// View full image function
function viewFullImage(imageSrc) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "imageViewModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('imageViewModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Payment Proof</h2>
        <button class="modal-close" onclick="closeModal('imageViewModal')">&times;</button>
      </div>
      <div class="modal-body">
        <img src="${imageSrc}" alt="Payment Proof" style="width: 100%; height: auto; border-radius: 8px;">
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

// Admin cancel reservation
function adminCancelReservation(reservationId) {
  if (!confirm("Are you sure you want to cancel this reservation?")) {
    return
  }

  const reason = prompt("Please provide a reason for cancellation:")
  if (!reason) return

  const reservationIndex = reservations.findIndex((r) => r.id === reservationId)
  if (reservationIndex === -1) {
    alert("Reservation not found.")
    return
  }

  reservations[reservationIndex] = {
    ...reservations[reservationIndex],
    status: "cancelled",
    cancellationReason: reason,
    cancelledAt: new Date().toISOString(),
    cancelledBy: currentUser.id,
  }

  localStorage.setItem("havenReservations", JSON.stringify(reservations))
  alert("Reservation cancelled successfully.")
  loadAllReservations()
}

// View reservation details
function viewReservationDetails(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)
  const user = users.find((u) => u.id === reservation.userId)
  const payment = payments.find((p) => p.reservationId === reservationId)

  if (!reservation) {
    alert("Reservation not found.")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reservationDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reservationDetailsModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reservation Details #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('reservationDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reservation-full-details">
          <div class="detail-section">
            <h4>Customer Information:</h4>
            <p><strong>Name:</strong> ${user ? user.name : "Unknown"}</p>
            <p><strong>Email:</strong> ${user ? user.email : "N/A"}</p>
            <p><strong>Phone:</strong> ${user ? user.phone : "N/A"}</p>
          </div>
          
          <div class="detail-section">
            <h4>Reservation Information:</h4>
            <p><strong>Date:</strong> ${formatDate(reservation.date)}</p>
            <p><strong>Time:</strong> ${formatTime(reservation.time)}</p>
            <p><strong>Table:</strong> ${reservation.tableName} (${reservation.tableCapacity} seats)</p>
            <p><strong>Status:</strong> ${reservation.status.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> ${reservation.paymentStatus.toUpperCase()}</p>
            <p><strong>Total Amount:</strong> $${reservation.totalAmount}</p>
          </div>
          
          ${
            reservation.menuItems
              ? `
          <div class="detail-section">
            <h4>Menu Items:</h4>
            <ul>
              ${reservation.menuItems.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
            </ul>
            <p><strong>Food Total:</strong> $${reservation.foodTotal}</p>
          </div>
          `
              : ""
          }
          
          ${
            reservation.specialRequests
              ? `
          <div class="detail-section">
            <h4>Special Requests:</h4>
            <p>${reservation.specialRequests}</p>
          </div>
          `
              : ""
          }
          
          ${
            payment
              ? `
          <div class="detail-section">
            <h4>Payment Information:</h4>
            <p><strong>Amount:</strong> $${payment.amount}</p>
            <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
            <p><strong>Created:</strong> ${formatDateTime(payment.createdAt)}</p>
            ${payment.expiryTime ? `<p><strong>Expires:</strong> ${formatDateTime(payment.expiryTime)}</p>` : ""}
            ${payment.verifiedAt ? `<p><strong>Verified:</strong> ${formatDateTime(payment.verifiedAt)}</p>` : ""}
          </div>
          `
              : ""
          }
          
          <div class="detail-section">
            <h4>System Information:</h4>
            <p><strong>Created:</strong> ${formatDateTime(reservation.createdAt)}</p>
            ${reservation.rescheduledAt ? `<p><strong>Last Rescheduled:</strong> ${formatDateTime(reservation.rescheduledAt)}</p>` : ""}
            ${reservation.cancelledAt ? `<p><strong>Cancelled:</strong> ${formatDateTime(reservation.cancelledAt)}</p>` : ""}
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

// Export functions for global access
window.showSection = showSection
window.makeReservation = makeReservation
window.viewReservations = viewReservations
window.editReservation = editReservation
window.rescheduleReservation = rescheduleReservation
window.showSignIn = showSignIn
window.showLogin = showLogin
window.showMyAccount = showMyAccount
window.showAdminPanel = showAdminPanel
window.showAdminTab = showAdminTab
window.logout = logout
window.closeModal = closeModal
window.selectTable = selectTable
window.proceedToTableSelection = proceedToTableSelection
window.proceedToReservationDetails = proceedToReservationDetails
window.toggleMenuItem = toggleMenuItem
window.approvePayment = approvePayment
window.rejectPayment = rejectPayment
window.viewFullImage = viewFullImage
window.adminCancelReservation = adminCancelReservation
window.viewReservationDetails = viewReservationDetails
window.selectReservationToReschedule = selectReservationToReschedule
