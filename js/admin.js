// Admin panel and management logic
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
window.showAdminPanel = showAdminPanel;
window.showAdminTab = showAdminTab;
window.approvePayment = approvePayment;
window.rejectPayment = rejectPayment;
window.adminCancelReservation = adminCancelReservation;
window.viewReservationDetails = viewReservationDetails;