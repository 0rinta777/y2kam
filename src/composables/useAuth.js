// ref = a value Vue watches (the screen updates when it changes)
// computed = a value calculated from other values, updates automatically
import { ref, computed } from 'vue'
// ID.unique() makes a random unique ID for new users
import { ID } from 'appwrite'
// Our Appwrite helpers from lib/appwrite.js
import { account, teams } from '@/lib/appwrite'

// --- Shared auth state ---
// These live OUTSIDE useAuth(), so every component (nav, router, pages)
// shares the same values instead of each getting its own copy.
const user = ref(null) // the logged-in user, or null if nobody is logged in
const isAdmin = ref(false) // true if the user is in the "admin" team
const ready = ref(false) // true once we've checked who is logged in

// Ask Appwrite who is logged in and whether they are an admin
async function loadUser() {
  try {
    // Get the current user. Throws an error if nobody is logged in.
    user.value = await account.get()
    // Get the teams this user belongs to, and check for the "admin" team
    const res = await teams.list()
    isAdmin.value = res.teams.some((t) => t.$id === 'admin')
  } catch {
    // Not logged in (or the request failed), so treat as logged out
    user.value = null
    isAdmin.value = false
  } finally {
    // Runs either way: we've now checked, so the router doesn't need to again
    ready.value = true
  }
}

// Log in with email and password
async function login(email, password) {
  // Creates a session: Appwrite remembers this browser is logged in
  await account.createEmailPasswordSession({ email, password })
  // Load the user's info and admin status
  await loadUser()
}

// Create a new account, then log straight in
async function register(name, email, password) {
  await account.create({ userId: ID.unique(), email, password, name })
  await login(email, password)
}

// Log out: delete the current session and reset the state
async function logout() {
  await account.deleteSession({ sessionId: 'current' })
  user.value = null
  isAdmin.value = false
}

// The composable: components call useAuth() to get the user and auth functions
export function useAuth() {
  // true when someone is logged in (!! turns the user object into true/false)
  const isLoggedIn = computed(() => !!user.value)
  return { user, isAdmin, isLoggedIn, ready, loadUser, login, register, logout }
}
