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
  const dashboardLink = document.getElementById("dashboardLink")

  if (currentUser) {
    userStatus.textContent = `Welcome, ${currentUser.name}`
    userStatus.style.display = "block"
    myAccountLink.style.display = "block"
    logoutLink.style.display = "block"

    // Show admin links for admin users
    if (currentUser.role === "admin") {
      adminLink.style.display = "block"
      dashboardLink.style.display = "block"
    }
  } else {
    userStatus.style.display = "none"
    myAccountLink.style.display = "none"
    logoutLink.style.display = "none"
    adminLink.style.display = "none"
    dashboardLink.style.display = "none"
  }
}

// Show different sections
function showSection(sectionName) {
  const sections = ["home", "about", "menu", "admin", "adminDashboard"]
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
      modalId === "rescheduleModal" ||
      modalId === "rescheduleDetailsModal"
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

// Admin Dashboard Functions
function showAdminDashboard() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Access denied. Admin privileges required.")
    return
  }

  showSection("adminDashboard")
  loadDashboardStats()
  showDashboardTab("overview")
}

function showDashboardTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".dashboard-tab-button").forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[onclick="showDashboardTab('${tabName}')"]`).classList.add("active")

  // Update tab content
  document.querySelectorAll(".dashboard-tab-content").forEach((content) => content.classList.remove("active"))
  document.getElementById(`dashboard${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add("active")

  // Load content based on tab
  switch (tabName) {
    case "overview":
      loadDashboardOverview()
      break
    case "customers":
      loadCustomerManagement()
      break
    case "reports":
      loadReportsSection()
      break
    case "settings":
      loadSettingsSection()
      break
  }
}

function loadDashboardStats() {
  // Calculate statistics
  const totalReservationsCount = reservations.length
  const totalRevenueAmount = reservations
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
  const pendingPaymentsCount = payments.filter((p) => p.status === "unpaid" && p.paymentProof).length
  const totalCustomersCount = users.filter((u) => u.role === "customer").length

  // Update stat cards
  document.getElementById("totalReservations").textContent = totalReservationsCount
  document.getElementById("totalRevenue").textContent = `$${totalRevenueAmount}`
  document.getElementById("pendingPayments").textContent = pendingPaymentsCount
  document.getElementById("totalCustomers").textContent = totalCustomersCount
}

function loadDashboardOverview() {
  loadRecentReservations()
  loadTableOccupancy()
  loadRevenueTrend()
}

function loadRecentReservations() {
  const container = document.getElementById("recentReservationsList")
  const recentReservations = reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  if (recentReservations.length === 0) {
    container.innerHTML = '<p class="no-data-small">No recent reservations</p>'
    return
  }

  let html = '<div class="recent-reservations">'
  recentReservations.forEach((reservation) => {
    const user = users.find((u) => u.id === reservation.userId)
    const statusColor = getStatusColor(reservation.status)

    html += `
      <div class="recent-reservation-item">
        <div class="reservation-info">
          <strong>${user ? user.name : "Unknown"}</strong>
          <span class="reservation-date">${formatDate(reservation.date)} ${formatTime(reservation.time)}</span>
        </div>
        <div class="reservation-meta">
          <span class="table-info">${reservation.tableName}</span>
          <span class="status-indicator" style="background: ${statusColor}">${reservation.status}</span>
        </div>
      </div>
    `
  })
  html += "</div>"
  container.innerHTML = html
}

function loadTableOccupancy() {
  const container = document.getElementById("tableOccupancyChart")
  const today = new Date().toISOString().split("T")[0]

  let html = '<div class="table-occupancy-grid">'

  tableData.forEach((table) => {
    const todayReservations = reservations.filter(
      (r) => r.tableId === table.id && r.date === today && (r.status === "confirmed" || r.status === "pending"),
    )

    const occupancyRate = (todayReservations.length / 9) * 100 // 9 time slots available
    const occupancyClass = occupancyRate > 75 ? "high" : occupancyRate > 50 ? "medium" : "low"

    html += `
      <div class="table-occupancy-item">
        <div class="table-name">${table.name}</div>
        <div class="occupancy-bar">
          <div class="occupancy-fill ${occupancyClass}" style="width: ${occupancyRate}%"></div>
        </div>
        <div class="occupancy-text">${Math.round(occupancyRate)}%</div>
      </div>
    `
  })

  html += "</div>"
  container.innerHTML = html
}

function loadRevenueTrend() {
  const container = document.getElementById("revenueTrendChart")
  const last7Days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const dayRevenue = reservations
      .filter((r) => r.date === dateStr && r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

    last7Days.push({
      date: dateStr,
      revenue: dayRevenue,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
    })
  }

  const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1)

  let html = '<div class="revenue-chart">'
  last7Days.forEach((day) => {
    const height = (day.revenue / maxRevenue) * 100
    html += `
      <div class="revenue-bar-container">
        <div class="revenue-bar" style="height: ${height}%"></div>
        <div class="revenue-amount">$${day.revenue}</div>
        <div class="revenue-day">${day.day}</div>
      </div>
    `
  })
  html += "</div>"
  container.innerHTML = html
}

function loadCustomerManagement() {
  const container = document.getElementById("customersList")
  const customers = users.filter((u) => u.role === "customer")

  if (customers.length === 0) {
    container.innerHTML = '<p class="no-data">No customers found</p>'
    return
  }

  let html = '<div class="customers-grid">'

  customers.forEach((customer) => {
    const customerReservations = reservations.filter((r) => r.userId === customer.id)
    const totalSpent = customerReservations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

    const customerType = totalSpent > 500 ? "VIP" : totalSpent > 200 ? "Regular" : "New"
    const typeClass = customerType.toLowerCase()

    html += `
      <div class="customer-card">
        <div class="customer-header">
          <div class="customer-info">
            <h5>${customer.name}</h5>
            <p>${customer.email}</p>
          </div>
          <span class="customer-type ${typeClass}">${customerType}</span>
        </div>
        <div class="customer-stats">
          <div class="customer-stat">
            <span class="stat-label">Reservations</span>
            <span class="stat-value">${customerReservations.length}</span>
          </div>
          <div class="customer-stat">
            <span class="stat-label">Total Spent</span>
            <span class="stat-value">$${totalSpent}</span>
          </div>
          <div class="customer-stat">
            <span class="stat-label">Member Since</span>
            <span class="stat-value">${formatDate(customer.createdAt.split("T")[0])}</span>
          </div>
        </div>
        <div class="customer-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails(${customer.id})">View Details</button>
          <button class="btn btn-primary btn-sm" onclick="sendCustomerMessage(${customer.id})">Send Message</button>
        </div>
      </div>
    `
  })

  html += "</div>"
  container.innerHTML = html
}

function loadReportsSection() {
  // Set default dates
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  document.getElementById("reportStartDate").value = lastMonth.toISOString().split("T")[0]
  document.getElementById("reportEndDate").value = today.toISOString().split("T")[0]
}

function loadSettingsSection() {
  // Load current settings from localStorage or defaults
  const settings = JSON.parse(localStorage.getItem("havenSettings") || "{}")

  document.getElementById("restaurantName").value = settings.restaurantName || "Haven Restaurant"
  document.getElementById("operatingHours").value = settings.operatingHours || "5:00 PM - 11:00 PM"
  document.getElementById("maxAdvanceBooking").value = settings.maxAdvanceBooking || 30
  document.getElementById("paymentTimeout").value = settings.paymentTimeout || 2
  document.getElementById("cancellationPolicy").value =
    settings.cancellationPolicy || "Cancellations must be made at least 24 hours in advance for full refund."
  document.getElementById("emailNotifications").checked = settings.emailNotifications !== false
  document.getElementById("smsNotifications").checked = settings.smsNotifications || false
  document.getElementById("autoConfirmation").checked = settings.autoConfirmation !== false
}

// Dashboard Action Functions
function exportReservations() {
  const csvContent = generateReservationsCSV()
  downloadCSV(csvContent, "reservations.csv")
  alert("Reservations exported successfully!")
}

function generateReservationsCSV() {
  const headers = [
    "ID",
    "Customer",
    "Email",
    "Date",
    "Time",
    "Table",
    "Party Size",
    "Status",
    "Payment Status",
    "Total Amount",
    "Created At",
  ]
  let csv = headers.join(",") + "\n"

  reservations.forEach((reservation) => {
    const user = users.find((u) => u.id === reservation.userId)
    const row = [
      reservation.id,
      user ? user.name : "Unknown",
      user ? user.email : "N/A",
      reservation.date,
      reservation.time,
      reservation.tableName,
      reservation.tableCapacity,
      reservation.status,
      reservation.paymentStatus,
      reservation.totalAmount || 0,
      reservation.createdAt,
    ]
    csv += row.map((field) => `"${field}"`).join(",") + "\n"
  })

  return csv
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

function sendBulkNotifications() {
  const message = prompt("Enter notification message:")
  if (!message) return

  const customers = users.filter((u) => u.role === "customer")
  alert(`Notification sent to ${customers.length} customers: "${message}"`)
}

function generateReport() {
  const reportData = {
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter((r) => r.status === "confirmed").length,
    totalRevenue: reservations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
    averagePartySize: reservations.reduce((sum, r) => sum + (r.tableCapacity || 0), 0) / reservations.length || 0,
    popularTables: getPopularTables(),
    peakHours: getPeakHours(),
  }

  showReportModal(reportData)
}

function getPopularTables() {
  const tableCounts = {}
  reservations.forEach((r) => {
    tableCounts[r.tableName] = (tableCounts[r.tableName] || 0) + 1
  })

  return Object.entries(tableCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([table, count]) => ({ table, count }))
}

function getPeakHours() {
  const hourCounts = {}
  reservations.forEach((r) => {
    const hour = r.time.split(":")[0]
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  return Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
}

function showReportModal(reportData) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reportModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reportModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Restaurant Report</h2>
        <button class="modal-close" onclick="closeModal('reportModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="report-summary">
          <h4>Summary Statistics</h4>
          <div class="report-stats-grid">
            <div class="report-stat">
              <span class="report-stat-label">Total Reservations</span>
              <span class="report-stat-value">${reportData.totalReservations}</span>
            </div>
            <div class="report-stat">
              <span class="report-stat-label">Confirmed Reservations</span>
              <span class="report-stat-value">${reportData.confirmedReservations}</span>
            </div>
            <div class="report-stat">
              <span class="report-stat-label">Total Revenue</span>
              <span class="report-stat-value">$${reportData.totalRevenue}</span>
            </div>
            <div class="report-stat">
              <span class="report-stat-label">Average Party Size</span>
              <span class="report-stat-value">${reportData.averagePartySize.toFixed(1)}</span>
            </div>
          </div>
          
          <div class="report-section">
            <h5>Popular Tables</h5>
            <ul>
              ${reportData.popularTables.map((t) => `<li>${t.table}: ${t.count} reservations</li>`).join("")}
            </ul>
          </div>
          
          <div class="report-section">
            <h5>Peak Hours</h5>
            <ul>
              ${reportData.peakHours.map((h) => `<li>${h.hour}: ${h.count} reservations</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function generateCustomReport() {
  const startDate = document.getElementById("reportStartDate").value
  const endDate = document.getElementById("reportEndDate").value
  const reportType = document.getElementById("reportType").value

  if (!startDate || !endDate) {
    alert("Please select both start and end dates")
    return
  }

  const filteredReservations = reservations.filter((r) => r.date >= startDate && r.date <= endDate)

  let reportHTML = ""

  switch (reportType) {
    case "revenue":
      reportHTML = generateRevenueReport(filteredReservations)
      break
    case "reservations":
      reportHTML = generateReservationsReport(filteredReservations)
      break
    case "customers":
      reportHTML = generateCustomersReport(filteredReservations)
      break
    case "tables":
      reportHTML = generateTablesReport(filteredReservations)
      break
  }

  document.getElementById("reportResults").innerHTML = reportHTML
}

function generateRevenueReport(reservations) {
  const totalRevenue = reservations
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

  const avgReservationValue = totalRevenue / reservations.length || 0

  return `
    <div class="report-results">
      <h4>Revenue Report</h4>
      <div class="report-metrics">
        <div class="metric">
          <span class="metric-label">Total Revenue</span>
          <span class="metric-value">$${totalRevenue}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Average Reservation Value</span>
          <span class="metric-value">$${avgReservationValue.toFixed(2)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Paid Reservations</span>
          <span class="metric-value">${reservations.filter((r) => r.paymentStatus === "paid").length}</span>
        </div>
      </div>
    </div>
  `
}

function generateReservationsReport(reservations) {
  const statusCounts = {}
  reservations.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  })

  return `
    <div class="report-results">
      <h4>Reservations Report</h4>
      <div class="report-metrics">
        <div class="metric">
          <span class="metric-label">Total Reservations</span>
          <span class="metric-value">${reservations.length}</span>
        </div>
        ${Object.entries(statusCounts)
          .map(
            ([status, count]) => `
          <div class="metric">
            <span class="metric-label">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <span class="metric-value">${count}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `
}

function generateCustomersReport(reservations) {
  const uniqueCustomers = new Set(reservations.map((r) => r.userId)).size
  const repeatCustomers = reservations.reduce((acc, r) => {
    acc[r.userId] = (acc[r.userId] || 0) + 1
    return acc
  }, {})

  const repeatCustomerCount = Object.values(repeatCustomers).filter((count) => count > 1).length

  return `
    <div class="report-results">
      <h4>Customer Report</h4>
      <div class="report-metrics">
        <div class="metric">
          <span class="metric-label">Unique Customers</span>
          <span class="metric-value">${uniqueCustomers}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Repeat Customers</span>
          <span class="metric-value">${repeatCustomerCount}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Customer Retention Rate</span>
          <span class="metric-value">${((repeatCustomerCount / uniqueCustomers) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `
}

function generateTablesReport(reservations) {
  const tableUtilization = {}
  reservations.forEach((r) => {
    tableUtilization[r.tableName] = (tableUtilization[r.tableName] || 0) + 1
  })

  return `
    <div class="report-results">
      <h4>Table Utilization Report</h4>
      <div class="table-utilization-list">
        ${Object.entries(tableUtilization)
          .sort(([, a], [, b]) => b - a)
          .map(
            ([table, count]) => `
            <div class="utilization-item">
              <span class="table-name">${table}</span>
              <span class="utilization-count">${count} reservations</span>
            </div>
          `,
          )
          .join("")}
      </div>
    </div>
  `
}

function filterCustomers() {
  const searchTerm = document.getElementById("customerSearch").value.toLowerCase()
  const filterType = document.getElementById("customerFilter").value

  let filteredCustomers = users.filter((u) => u.role === "customer")

  if (searchTerm) {
    filteredCustomers = filteredCustomers.filter(
      (c) => c.name.toLowerCase().includes(searchTerm) || c.email.toLowerCase().includes(searchTerm),
    )
  }

  if (filterType !== "all") {
    filteredCustomers = filteredCustomers.filter((customer) => {
      const customerReservations = reservations.filter((r) => r.userId === customer.id)
      const totalSpent = customerReservations
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

      switch (filterType) {
        case "vip":
          return totalSpent > 500
        case "active":
          return customerReservations.length > 0
        case "new":
          return customerReservations.length === 0
        default:
          return true
      }
    })
  }

  // Re-render customer list with filtered results
  renderFilteredCustomers(filteredCustomers)
}

function renderFilteredCustomers(customers) {
  const container = document.getElementById("customersList")

  if (customers.length === 0) {
    container.innerHTML = '<p class="no-data">No customers found matching the criteria</p>'
    return
  }

  let html = '<div class="customers-grid">'

  customers.forEach((customer) => {
    const customerReservations = reservations.filter((r) => r.userId === customer.id)
    const totalSpent = customerReservations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

    const customerType = totalSpent > 500 ? "VIP" : totalSpent > 200 ? "Regular" : "New"
    const typeClass = customerType.toLowerCase()

    html += `
      <div class="customer-card">
        <div class="customer-header">
          <div class="customer-info">
            <h5>${customer.name}</h5>
            <p>${customer.email}</p>
          </div>
          <span class="customer-type ${typeClass}">${customerType}</span>
        </div>
        <div class="customer-stats">
          <div class="customer-stat">
            <span class="stat-label">Reservations</span>
            <span class="stat-value">${customerReservations.length}</span>
          </div>
          <div class="customer-stat">
            <span class="stat-label">Total Spent</span>
            <span class="stat-value">$${totalSpent}</span>
          </div>
          <div class="customer-stat">
            <span class="stat-label">Member Since</span>
            <span class="stat-value">${formatDate(customer.createdAt.split("T")[0])}</span>
          </div>
        </div>
        <div class="customer-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails(${customer.id})">View Details</button>
          <button class="btn btn-primary btn-sm" onclick="sendCustomerMessage(${customer.id})">Send Message</button>
        </div>
      </div>
    `
  })

  html += "</div>"
  container.innerHTML = html
}

function viewCustomerDetails(customerId) {
  const customer = users.find((u) => u.id === customerId)
  const customerReservations = reservations.filter((r) => r.userId === customerId)

  if (!customer) {
    alert("Customer not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "customerDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('customerDetailsModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Customer Details: ${customer.name}</h2>
        <button class="modal-close" onclick="closeModal('customerDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="customer-details">
          <div class="customer-info-section">
            <h4>Contact Information</h4>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Member Since:</strong> ${formatDateTime(customer.createdAt)}</p>
          </div>
          
          <div class="customer-reservations-section">
            <h4>Reservation History (${customerReservations.length} total)</h4>
            <div class="customer-reservations-list">
              ${
                customerReservations.length === 0
                  ? '<p class="no-data-small">No reservations found</p>'
                  : customerReservations
                      .slice(0, 10)
                      .map(
                        (reservation) => `
                  <div class="customer-reservation-item">
                    <div class="reservation-date">${formatDate(reservation.date)} ${formatTime(reservation.time)}</div>
                    <div class="reservation-details">
                      <span>${reservation.tableName}</span>
                      <span class="status-badge ${reservation.status}">${reservation.status}</span>
                      <span class="amount">$${reservation.totalAmount}</span>
                    </div>
                  </div>
                `,
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function sendCustomerMessage(customerId) {
  const customer = users.find((u) => u.id === customerId)
  if (!customer) {
    alert("Customer not found")
    return
  }

  const message = prompt(`Send message to ${customer.name}:`)
  if (message) {
    alert(`Message sent to ${customer.name}: "${message}"`)
  }
}

function saveSettings() {
  const settings = {
    restaurantName: document.getElementById("restaurantName").value,
    operatingHours: document.getElementById("operatingHours").value,
    maxAdvanceBooking: Number.parseInt(document.getElementById("maxAdvanceBooking").value),
    paymentTimeout: Number.parseInt(document.getElementById("paymentTimeout").value),
    cancellationPolicy: document.getElementById("cancellationPolicy").value,
    emailNotifications: document.getElementById("emailNotifications").checked,
    smsNotifications: document.getElementById("smsNotifications").checked,
    autoConfirmation: document.getElementById("autoConfirmation").checked,
  }

  localStorage.setItem("havenSettings", JSON.stringify(settings))
  alert("Settings saved successfully!")
}

function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to default?")) {
    localStorage.removeItem("havenSettings")
    loadSettingsSection()
    alert("Settings reset to default values")
  }
}

// Helper functions
function formatDateFunc(dateString) {
  const date = new Date(dateString)
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

function formatTimeFunc(timeString) {
  const [hours, minutes] = timeString.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12
  return `${formattedHours}:${minutes} ${period}`
}

function formatDateTimeFunc(dateTimeString) {
  const date = new Date(dateTimeString)
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }
  return date.toLocaleString("en-US", options)
}

function getStatusColorFunc(status) {
  switch (status) {
    case "pending":
      return "#ffc107" // Yellow
    case "confirmed":
      return "#28a745" // Green
    case "cancelled":
      return "#dc3545" // Red
    case "expired":
      return "#6c757d" // Gray
    default:
      return "#007bff" // Blue
  }
}

function handleModalClickFunc(event) {
  if (event.target.classList.contains("modal-overlay")) {
    const modalId = event.target.parentNode.id
    closeModal(modalId)
  }
}

function viewFullImageFunc(imageSrc) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "imageModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('imageModal')"></div>
    <div class="modal-content image-content">
      <img src="${imageSrc}" alt="Full Image">
      <button class="modal-close" onclick="closeModal('imageModal')">&times;</button>
    </div>
  `
  document.body.appendChild(modal)
  modal.style.display = "block"
}

function adminCancelReservationFunc(reservationId) {
  if (!confirm("Are you sure you want to cancel this reservation?")) {
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)
  if (reservation) {
    reservation.status = "cancelled"
    reservation.paymentStatus = "refunded"

    // Update payment status
    const payment = payments.find((p) => p.reservationId === reservation.id)
    if (payment) {
      payment.status = "refunded"
    }

    localStorage.setItem("havenReservations", JSON.stringify(reservations))
    localStorage.setItem("havenPayments", JSON.stringify(payments))

    alert("Reservation cancelled successfully!")
    loadAllReservations()
  }
}

function viewReservationDetailsFunc(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reservationListModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reservationListModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reservation Details #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('reservationListModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reservation-details">
          <div class="detail-row">
            <span>Customer:</span>
            <span>${reservation.userName} (${reservation.userEmail})</span>
          </div>
          <div class="detail-row">
            <span>Date & Time:</span>
            <span>${formatDateFunc(reservation.date)} at ${formatTimeFunc(reservation.time)}</span>
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
            <span>Status:</span>
            <span class="status-badge ${reservation.status}">${reservation.status}</span>
          </div>
          <div class="detail-row">
            <span>Payment Status:</span>
            <span class="payment-badge ${reservation.paymentStatus}">${reservation.paymentStatus}</span>
          </div>
          <div class="detail-row">
            <span>Special Requests:</span>
            <span>${reservation.specialRequests || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span>Menu Items:</span>
            <ul>
              ${reservation.menuItems.map((item) => `<li>${item.name} ($${item.price})</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function selectReservationToRescheduleFunc(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Reschedule Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleModal')">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to reschedule this reservation?</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="showRescheduleDetailsFunc(${reservation.id})">Yes, Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function showRescheduleDetailsFunc(reservationId) {
  closeModal("rescheduleModal")

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleDetailsModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enter New Details for Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="rescheduleForm">
          <div class="form-group">
            <label for="rescheduleDate">New Date:</label>
            <input type="date" id="rescheduleDate" name="rescheduleDate" min="${new Date().toISOString().split("T")[0]}" required>
          </div>
          <div class="form-group">
            <label for="rescheduleTime">New Time:</label>
            <input type="time" id="rescheduleTime" name="rescheduleTime" required>
          </div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="confirmRescheduleFunc(${reservation.id})">Confirm Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleDetailsModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function confirmRescheduleFunc(reservationId) {
  const newDate = document.getElementById("rescheduleDate").value
  const newTime = document.getElementById("rescheduleTime").value

  if (!newDate || !newTime) {
    alert("Please select both a new date and time.")
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  // Check table availability
  const isTableAvailable = checkTableAvailability(reservation.tableId, newDate, newTime)
  if (!isTableAvailable) {
    alert("Selected table is not available at this time. Please choose a different time or table.")
    return
  }

  reservation.date = newDate
  reservation.time = newTime
  reservation.status = "confirmed" // Or keep the original status?

  localStorage.setItem("havenReservations", JSON.stringify(reservations))
  closeModal("rescheduleDetailsModal")
  alert("Reservation rescheduled successfully!")
  loadAllReservations()
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
window.showRescheduleDetails = showRescheduleDetails
window.confirmReschedule = confirmReschedule

// Export new functions for global access
window.showAdminDashboard = showAdminDashboard
window.showDashboardTab = showDashboardTab
window.exportReservations = exportReservations
window.sendBulkNotifications = sendBulkNotifications
window.generateReport = generateReport
window.generateCustomReport = generateCustomReport
window.filterCustomers = filterCustomers
window.viewCustomerDetails = viewCustomerDetails
window.sendCustomerMessage = sendCustomerMessage
window.saveSettings = saveSettings
window.resetSettings = resetSettings

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12
  return `${formattedHours}:${minutes} ${period}`
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString)
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }
  return date.toLocaleString("en-US", options)
}

function getStatusColor(status) {
  switch (status) {
    case "pending":
      return "#ffc107" // Yellow
    case "confirmed":
      return "#28a745" // Green
    case "cancelled":
      return "#dc3545" // Red
    case "expired":
      return "#6c757d" // Gray
    default:
      return "#007bff" // Blue
  }
}

function handleModalClick(event) {
  if (event.target.classList.contains("modal-overlay")) {
    const modalId = event.target.parentNode.id
    closeModal(modalId)
  }
}

function viewFullImage(imageSrc) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "imageModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('imageModal')"></div>
    <div class="modal-content image-content">
      <img src="${imageSrc}" alt="Full Image">
      <button class="modal-close" onclick="closeModal('imageModal')">&times;</button>
    </div>
  `
  document.body.appendChild(modal)
  modal.style.display = "block"
}

function adminCancelReservation(reservationId) {
  if (!confirm("Are you sure you want to cancel this reservation?")) {
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)
  if (reservation) {
    reservation.status = "cancelled"
    reservation.paymentStatus = "refunded"

    // Update payment status
    const payment = payments.find((p) => p.reservationId === reservation.id)
    if (payment) {
      payment.status = "refunded"
    }

    localStorage.setItem("havenReservations", JSON.stringify(reservations))
    localStorage.setItem("havenPayments", JSON.stringify(payments))

    alert("Reservation cancelled successfully!")
    loadAllReservations()
  }
}

function viewReservationDetails(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reservationListModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reservationListModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reservation Details #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('reservationListModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reservation-details">
          <div class="detail-row">
            <span>Customer:</span>
            <span>${reservation.userName} (${reservation.userEmail})</span>
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
            <span>Status:</span>
            <span class="status-badge ${reservation.status}">${reservation.status}</span>
          </div>
          <div class="detail-row">
            <span>Payment Status:</span>
            <span class="payment-badge ${reservation.paymentStatus}">${reservation.paymentStatus}</span>
          </div>
          <div class="detail-row">
            <span>Special Requests:</span>
            <span>${reservation.specialRequests || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span>Menu Items:</span>
            <ul>
              ${reservation.menuItems.map((item) => `<li>${item.name} ($${item.price})</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function selectReservationToReschedule(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Reschedule Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleModal')">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to reschedule this reservation?</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="showRescheduleDetails(${reservation.id})">Yes, Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function showRescheduleDetails(reservationId) {
  closeModal("rescheduleModal")

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleDetailsModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enter New Details for Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="rescheduleForm">
          <div class="form-group">
            <label for="rescheduleDate">New Date:</label>
            <input type="date" id="rescheduleDate" name="rescheduleDate" min="${new Date().toISOString().split("T")[0]}" required>
          </div>
          <div class="form-group">
            <label for="rescheduleTime">New Time:</label>
            <input type="time" id="rescheduleTime" name="rescheduleTime" required>
          </div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="confirmReschedule(${reservation.id})">Confirm Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleDetailsModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function confirmReschedule(reservationId) {
  const newDate = document.getElementById("rescheduleDate").value
  const newTime = document.getElementById("rescheduleTime").value

  if (!newDate || !newTime) {
    alert("Please select both a new date and time.")
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  // Check table availability
  const isTableAvailable = checkTableAvailability(reservation.tableId, newDate, newTime)
  if (!isTableAvailable) {
    alert("Selected table is not available at this time. Please choose a different time or table.")
    return
  }

  reservation.date = newDate
  reservation.time = newTime
  reservation.status = "confirmed" // Or keep the original status?

  localStorage.setItem("havenReservations", JSON.stringify(reservations))
  closeModal("rescheduleDetailsModal")
  alert("Reservation rescheduled successfully!")
  loadAllReservations()
}

// Export new functions for global access
window.showAdminDashboard = showAdminDashboard
window.showDashboardTab = showDashboardTab
window.exportReservations = exportReservations
window.sendBulkNotifications = sendBulkNotifications
window.generateReport = generateReport
window.generateCustomReport = generateCustomReport
window.filterCustomers = filterCustomers
window.viewCustomerDetails = viewCustomerDetails
window.sendCustomerMessage = sendCustomerMessage
window.saveSettings = saveSettings
window.resetSettings = resetSettings

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12
  return `${formattedHours}:${minutes} ${period}`
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString)
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }
  return date.toLocaleString("en-US", options)
}

function getStatusColor(status) {
  switch (status) {
    case "pending":
      return "#ffc107" // Yellow
    case "confirmed":
      return "#28a745" // Green
    case "cancelled":
      return "#dc3545" // Red
    case "expired":
      return "#6c757d" // Gray
    default:
      return "#007bff" // Blue
  }
}

function handleModalClick(event) {
  if (event.target.classList.contains("modal-overlay")) {
    const modalId = event.target.parentNode.id
    closeModal(modalId)
  }
}

function viewFullImage(imageSrc) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "imageModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('imageModal')"></div>
    <div class="modal-content image-content">
      <img src="${imageSrc}" alt="Full Image">
      <button class="modal-close" onclick="closeModal('imageModal')">&times;</button>
    </div>
  `
  document.body.appendChild(modal)
  modal.style.display = "block"
}

function adminCancelReservation(reservationId) {
  if (!confirm("Are you sure you want to cancel this reservation?")) {
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)
  if (reservation) {
    reservation.status = "cancelled"
    reservation.paymentStatus = "refunded"

    // Update payment status
    const payment = payments.find((p) => p.reservationId === reservation.id)
    if (payment) {
      payment.status = "refunded"
    }

    localStorage.setItem("havenReservations", JSON.stringify(reservations))
    localStorage.setItem("havenPayments", JSON.stringify(payments))

    alert("Reservation cancelled successfully!")
    loadAllReservations()
  }
}

function viewReservationDetails(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "reservationListModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('reservationListModal')"></div>
    <div class="modal-content large">
      <div class="modal-header">
        <h2>Reservation Details #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('reservationListModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="reservation-details">
          <div class="detail-row">
            <span>Customer:</span>
            <span>${reservation.userName} (${reservation.userEmail})</span>
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
            <span>Status:</span>
            <span class="status-badge ${reservation.status}">${reservation.status}</span>
          </div>
          <div class="detail-row">
            <span>Payment Status:</span>
            <span class="payment-badge ${reservation.paymentStatus}">${reservation.paymentStatus}</span>
          </div>
          <div class="detail-row">
            <span>Special Requests:</span>
            <span>${reservation.specialRequests || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span>Menu Items:</span>
            <ul>
              ${reservation.menuItems.map((item) => `<li>${item.name} ($${item.price})</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function selectReservationToReschedule(reservationId) {
  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Reschedule Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleModal')">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to reschedule this reservation?</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="showRescheduleDetails(${reservation.id})">Yes, Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function showRescheduleDetails(reservationId) {
  closeModal("rescheduleModal")

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rescheduleDetailsModal"
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal('rescheduleDetailsModal')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enter New Details for Reservation #${reservation.id}</h2>
        <button class="modal-close" onclick="closeModal('rescheduleDetailsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="rescheduleForm">
          <div class="form-group">
            <label for="rescheduleDate">New Date:</label>
            <input type="date" id="rescheduleDate" name="rescheduleDate" min="${new Date().toISOString().split("T")[0]}" required>
          </div>
          <div class="form-group">
            <label for="rescheduleTime">New Time:</label>
            <input type="time" id="rescheduleTime" name="rescheduleTime" required>
          </div>
        </form>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="confirmReschedule(${reservation.id})">Confirm Reschedule</button>
          <button class="btn btn-secondary" onclick="closeModal('rescheduleDetailsModal')">Cancel</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
}

function confirmReschedule(reservationId) {
  const newDate = document.getElementById("rescheduleDate").value
  const newTime = document.getElementById("rescheduleTime").value

  if (!newDate || !newTime) {
    alert("Please select both a new date and time.")
    return
  }

  const reservation = reservations.find((r) => r.id === reservationId)

  if (!reservation) {
    alert("Reservation not found")
    return
  }

  // Check table availability
  const isTableAvailable = checkTableAvailability(reservation.tableId, newDate, newTime)
  if (!isTableAvailable) {
    alert("Selected table is not available at this time. Please choose a different time or table.")
    return
  }

  reservation.date = newDate
  reservation.time = newTime
  reservation.status = "confirmed" // Or keep the original status?

  localStorage.setItem("havenReservations", JSON.stringify(reservations))
  closeModal("rescheduleDetailsModal")
  alert("Reservation rescheduled successfully!")
  loadAllReservations()
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
