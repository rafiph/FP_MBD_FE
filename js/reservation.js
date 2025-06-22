// Reservation, menu, table, and payment logic
const reservations = JSON.parse(localStorage.getItem("havenReservations") || "[]")
const payments = JSON.parse(localStorage.getItem("havenPayments") || "[]")
let selectedMenuItems = []
let selectedTable = null
let currentReservationStep = 1
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

function selectTable(tableId) {
  selectedTable = tableData.find((table) => table.id === tableId)
  renderTableSelection()

  // Enable proceed button
  const proceedBtn = document.getElementById("proceedToDetailsBtn")
  if (proceedBtn) {
    proceedBtn.disabled = false
  }
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

// Payment expiry checker
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

// Export functions for global access
window.makeReservation = makeReservation;
window.viewReservations = viewReservations;
window.editReservation = editReservation;
window.rescheduleReservation = rescheduleReservation;
window.selectTable = selectTable;
window.proceedToTableSelection = proceedToTableSelection;
window.proceedToReservationDetails = proceedToReservationDetails;
window.toggleMenuItem = toggleMenuItem;