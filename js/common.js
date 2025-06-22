// Common/shared functions: user management, modals, login/signup, UI updates

// User management variables and functions
let currentUser = null
const users = JSON.parse(localStorage.getItem("havenUsers") || "[]")

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus()
  setMinDate()
  initializeEventListeners()
  startPaymentExpiryChecker()
})

// Check login status and update UI accordingly
function checkLoginStatus() {
  currentUser = JSON.parse(localStorage.getItem("currentUser"))
  updateUserInterface()
}

// Update user interface elements based on login status
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

// Show a specific section and hide others
function showSection(sectionId) {
  const sections = document.querySelectorAll("section")
  sections.forEach((section) => {
    section.style.display = "none"
  })
  document.getElementById(sectionId).style.display = "block"
}

// Modal functions
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

// Sign up new users
function handleSignUp(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const newUser = Object.fromEntries(formData)
  users.push(newUser)
  localStorage.setItem("havenUsers", JSON.stringify(users))
  showSection("loginSection")
}

// Log in existing users
function handleLogin(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const credentials = Object.fromEntries(formData)
  const user = users.find(
    (u) => u.email === credentials.email && u.password === credentials.password
  )
  if (user) {
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(currentUser))
    updateUserInterface()
    showSection("accountSection")
  } else {
    alert("Invalid email or password")
  }
}

// Log out the current user
function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  updateUserInterface()
  showSection("homeSection")
}

// Show sign-in modal
function showSignIn() {
  document.getElementById("signInModal").style.display = "block"
}

// Show login modal
function showLogin() {
  document.getElementById("loginModal").style.display = "block"
}

// Show user account details
function showMyAccount() {
  document.getElementById("accountDetails").innerText = JSON.stringify(currentUser, null, 2)
  document.getElementById("accountModal").style.display = "block"
}

// Handle clicks outside of modals
window.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal")) {
    closeModal(event.target.id)
  }
})

// Utility functions
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

function formatTime(dateString) {
  const options = { hour: "numeric", minute: "numeric", second: "numeric" }
  return new Date(dateString).toLocaleTimeString(undefined, options)
}

function formatDateTime(dateString) {
  return `${formatDate(dateString)} ${formatTime(dateString)}`
}

function viewFullImage(imageUrl) {
  const modal = document.getElementById("imageModal")
  modal.querySelector("img").src = imageUrl
  modal.style.display = "block"
}

// Export functions for global access
window.showSection = showSection;
window.showSignIn = showSignIn;
window.showLogin = showLogin;
window.showMyAccount = showMyAccount;
window.logout = logout;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.viewFullImage = viewFullImage;
