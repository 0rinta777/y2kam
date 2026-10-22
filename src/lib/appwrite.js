// Load the tools we need from the Appwrite library (installed with npm install appwrite)
import { Client, Account, TablesDB, Storage, Teams } from 'appwrite'

// Create ONE connection to our Appwrite project.
// The endpoint (server address) and project ID come from the .env file,
// so the real values are not written in the code or pushed to GitHub.
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

// Helpers that use the connection. Other files import these instead of
// setting up Appwrite again, so all backend access starts in this one file.
export const account = new Account(client) // sign up, log in, log out, current user
export const tablesDB = new TablesDB(client) // read and write rows in our tables (strips, comments...)
export const storage = new Storage(client) // upload and show images in the bucket
export const teams = new Teams(client) // check which teams the user is in (admin check)

// IDs of our database and storage bucket, also read from .env,
// so we don't have to repeat them in every file
export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID