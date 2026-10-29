# y2kam ♥

**y2kam** is a free online photobooth with an early 2000s feel aesthetic.
Take 4 photos with a countdown, pick a filter and a frame, and get your own photo strip.
Save it to your gallery, keep it private or share it on the wall with other members.

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Project structure](#project-structure)
5. [Data model (Appwrite)](#data-model-appwrite)
6. [Users, roles and permissions](#users-roles-and-permissions)
7. [CRUD](#crud)
8. [UX](#ux)
9. [Priority list](#priority-list)
10. [Known limitations](#known-limitations)
11. [AI usage](#ai-usage)
12. [Credits](#credits)

---

## Features

**Visitors (not logged in)**
- Home and about pages, contact form
- Use the booth: camera starts by itself, countdown, 4 photos, live filter previews and frames, download the strip
- Log in or sign up to save the strip (the strip is kept while logging in)

**Members (logged in)**
- Save strips to **my gallery**, edit the caption, make them private or post them to the **wall**, delete them
- The wall: everyone's public strips, likes and comments, report a strip
- Profile page with picture, bio and stats; notifications for likes and comments
- Settings: profile picture, username, bio, password, delete account
- Password reset by email

**Admins** (members of the `admin` team)
- Separate admin login and admin area
- Dashboard with counts
- **Filters & frames:** create, edit, activate/deactivate and delete the filters (sliders + Y2K effects) and
  frames (PNG + optional cover picture) used in the booth
- **Reports:** remove a reported strip or keep it
- **Messages:** read and delete contact-form messages

---

## Tech stack

- **Vue 3** (Composition API, `<script setup>`) + **Vue Router**
- **Vite**
- **Appwrite Cloud:** Auth, TablesDB (database), Storage, Teams, Sites (hosting)
- Plain CSS (no UI library), Google Fonts (Shrikhand, Inter)

Node version: `^22.18.0 || >=24.12.0` (see `package.json`).

---

## Getting started

```bash
npm install
cp .env.example .env    # then fill in your own Appwrite values
npm run dev             # http://localhost:5173
npm run build           # production build in /dist
```

`.env` values:

| variable | what it is |
|---|---|
| `VITE_APPWRITE_ENDPOINT` | Appwrite endpoint, e.g. `https://fra.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID |
| `VITE_APPWRITE_DATABASE_ID` | database ID |
| `VITE_APPWRITE_BUCKET_ID` | storage bucket ID (`strips`) |

These values are **public** (they end up in the browser bundle). No API keys or secrets are used in the frontend,
and `.env` is in `.gitignore`.

In Appwrite you also need: a **Web platform** for `localhost` and for the live domain, the tables and bucket below,
and a team with the ID `admin`.

---

## Project structure

```
src/
├── main.js                 app start
├── App.vue                 top bar / nav, page wrapper, background
├── router/index.js         routes, navigation guards, page titles
├── lib/                    plain helpers (no Vue)
│   ├── appwrite.js         ONE Appwrite client: account, tablesDB, storage, teams
│   ├── strip.js            builds the photo strip on a canvas
│   ├── filters.js          filter settings → CSS + extra effects on the canvas
│   ├── image.js            crops a profile picture to a square
│   └── format.js           date formatting
├── composables/            logic + data access, one per area
│   ├── useAuth.js          login, logout, sign up, admin check (shared state)
│   ├── useCamera.js        webcam start/stop/capture
│   ├── useStrips.js        strips CRUD + file permissions
│   ├── useCatalog.js       filters & frames CRUD (admin)
│   ├── useComments.js  useLikes.js  useReports.js  useMessages.js
│   ├── useProfile.js  useNotifications.js  useStats.js  useAccount.js
├── components/             reusable UI pieces
│   ├── StripCard.vue  EditStripModal.vue  ReportDialog.vue  CommentSection.vue
│   ├── LikeButton.vue  NotificationBell.vue  ContactForm.vue
│   ├── FilterPicker.vue  FilterEffects.vue  FramePicker.vue  LeopardBackground.vue
│   └── admin/CatalogDrawer.vue
└── views/                  one per page (orchestrates components + composables)
    ├── HomeView  BoothView  WallView  StripDetailView  GalleryView
    ├── ProfileView  SettingsView  AboutView  LoginView  ResetPasswordView  NotFoundView
    └── admin/  AdminLayout  AdminLoginView  AdminDashboardView
                AdminCatalogView  AdminReportsView  AdminMessagesView
```

**Separation of concerns**
- **UI:** views and components only show data and react to clicks.
- **Logic and data access:** composables (`useStrips`, `useCatalog`…). Views never call Appwrite directly.
- **External service:** all Appwrite setup lives in `lib/appwrite.js`, IDs come from `.env`.
- **Authentication:** `useAuth.js` keeps the logged-in user and admin status as shared state (no Pinia needed).
- **Browser-only work:** camera (`useCamera`), canvas (`lib/strip.js`, `lib/filters.js`).

---

## Data model (Appwrite)

One database, one storage bucket (`strips`) and one team (`admin`).

| table | fields | notes |
|---|---|---|
| **strips** | `userId`, `username`, `imageId`, `caption`, `filter`, `isPublic` | `imageId` → file in the bucket |
| **comments** | `stripId`, `userId`, `username`, `text` | `stripId` → strips |
| **likes** | `stripId`, `userId` | one like per user per strip |
| **reports** | `stripId`, `reporterId`, `reason`, `note`, `status` (open/resolved) | `stripId` → strips |
| **catalog** | `name`, `type` (filter/frame), `active`, `fileId`, `settings` (JSON: sliders, or a frame's `coverId`) | `fileId` / `coverId` → images in the bucket |
| **profiles** | row ID = user ID; `username` (unique), `bio`, `avatarId`, `seenAt` | `avatarId` → file in the bucket |
| **messages** | `name`, `email`, `message`, `status` (new/read) | contact form |

**Storage bucket `strips`:** strip images, frame images and profile pictures.

**Relationships:** a strip belongs to a user (`userId`) and has one image (`imageId`).
Comments, likes and reports point to a strip (`stripId`). A profile uses the user's ID as its row ID.

**Deleting:** the image file is deleted first, then the row. When an admin replaces a frame image, the new
file is uploaded and saved first, and only then is the old file deleted.

---

## Users, roles and permissions

| | guest | member | admin team |
|---|---|---|---|
| use the booth, download a strip | ✅ | ✅ | ✅ |
| contact form | ✅ | ✅ | ✅ |
| save strips, gallery | ❌ | ✅ own | ✅ own |
| see the wall, like, comment, report | ❌ | ✅ | ✅ |
| see someone else's **private** strip | ❌ | ❌ | ✅ (to moderate reports) |
| edit / delete a strip | ❌ | ✅ own only | delete (reported strips) |
| filters & frames, reports, messages | ❌ | ❌ | ✅ |

### How it is enforced

**Frontend (navigation only):** routes have `meta.requiresAuth` / `meta.requiresAdmin`; a navigation guard in
`router/index.js` sends visitors to the login page or the admin login. This is just for navigation —
**security is enforced by Appwrite.**

**Backend (Appwrite):**
- **Row security** is on for every table and **file security** is on for the bucket.
- At table/bucket level, members can only **create**. They never get read/update/delete there.
- Each row and file gets its **own permissions** when it is created (`useStrips.js`):
  - owner: read, update, delete
  - plus `users` read when the strip is public
  - the photo file gets the same rules as its row, so a private strip's photo is really private
- If posting a strip fails halfway, the photo's permissions are rolled back, so a photo is never more public
  than its strip.
- The **admin team** has read/delete at table and bucket level for moderation, and full access to the catalog.
- Comments, likes and profiles are readable by all members at table level (they have no private data).
- Frames and profile pictures are readable by anyone (needed to draw frames and show avatars).

| table / bucket | all users | any (guests) | admin team |
|---|---|---|---|
| strips | create | – | read, delete |
| comments | create, read | – | read, delete |
| likes | create, read | – | – |
| reports | create | – | read, update, delete |
| profiles | create, read | – | – |
| messages | create | create | read, update, delete |
| catalog | – | read | create, read, update, delete |
| bucket `strips` | create | – | read, delete |

### Permission tests (28 Oct 2026)

| test | expected | result |
|---|---|---|
| guest opens the wall | no strips | ✅ |
| guest opens a private photo link | 401 from Appwrite | ✅ |
| user B opens user A's private strip page | "doesn't exist or is private" | ✅ |
| user B opens user A's private photo link | 401 from Appwrite | ✅ |
| user B's gallery | only B's own strips | ✅ |
| admin removes a reported strip | strip + photo deleted | ✅ |

Screenshots of the Appwrite settings and tests are in the project report.

---

## CRUD

Two complete workflows, both with data in Appwrite:

| | strips (members) | catalog: filters & frames (admins) |
|---|---|---|
| **Create** | take 4 photos → save strip (image + row) | add a filter (sliders) or a frame (PNG upload) |
| **Read** | gallery, wall, strip page, profile | admin list; active items load in the booth |
| **Update** | edit caption, post to wall / make private | edit settings, replace image, activate/deactivate |
| **Delete** | delete own strip (image + row) | delete item (row + image) |

Plus: comments (create/delete own), likes (create/delete), reports (create → admin resolves or removes),
messages (create → admin reads/deletes), profiles (create/update).

---

## UX

- **States:** loading, empty and error states on every list; toasts after actions; disabled buttons while saving.
- **Forms:** labels, required fields, length limits, inline error messages (`aria-invalid`, `role="alert"`).
- **Booth:** camera starts automatically, round live filter previews and frame covers, "try again" if the camera
  is blocked, everything fits on one screen on desktop.
- **iPhone/iPad:** photos are loaded with the login attached (Safari blocks the cookie otherwise), and filters are
  drawn pixel by pixel on Safari, which does not support canvas filters.
- **Responsive:** separate layouts for desktop and phones (hamburger menu, compact cards).
- **Accessibility:** visible keyboard focus, alt texts, `aria-pressed`/`aria-expanded`, reduced motion respected.
- **Design:** made in Figma first (lo-fi → hi-fi), Y2K purple theme, Shrikhand + Inter.

---

## Priority list

**Must have:** booth (camera, countdown, strip) · login/logout/sign up · save strips to Appwrite ·
gallery CRUD · protected routes and guards · admin login and area · backend permissions ·
loading/empty/error states

**Should have:** the wall · filters & frames managed by admin · reports · likes and comments ·
password reset · mobile layout

**Could have:** profiles with picture and bio · notifications · contact form + admin messages ·
copy link, download · guest strip kept through login · leopard/swirl decorations

**Won't have (this time):** stickers / drag-and-drop editing · GIF mode · server-side upload checks ·
automated tests · full data erasure on account deletion

---

## Known limitations

- **No server-side code:** ownership fields like `userId` are written by the browser; Appwrite permissions
  stop people editing others' data, but a member could create a row with a wrong `userId`.
  Next step: an Appwrite Function.
- **Uploads** are only checked in the browser (type, size), not on the server.
- **Deleting an account** removes your strips, comments and profile and blocks the account, but it is not a
  full erasure, and a failed file deletion is only logged.
- **Comments and likes** are readable by all members via the API, even on private strips (the app never
  shows them).
- **Limits:** 50 strips in the gallery, 100 catalog items, 12 strips per page on the wall.
- **Safari:** the soft-focus (blur) effect is not applied to saved strips, and grain looks slightly different live
  and on the saved strip.
- **No automated tests**, and dialogs don't trap keyboard focus yet.
- All old strips from before the privacy fix were deleted, so there are no files with old permissions left.

---

## AI usage

I used **Claude (Anthropic)** during development. I used it for planning, explaining concepts, writing and debugging code, styling from my Figma designs and
documentation. I checked, tested and adjusted the suggestions myself; I rejected draggable stickers (chose fixed
frames) and public photo files (privacy first).

One example of a correction: the AI told me to give all users broad permissions on the bucket and strips table.
My own tests as a guest and as a second user showed private photos were then visible, because Appwrite allows
access if **either** the table/bucket **or** the row/file allows it. I locked the table and bucket back down
and proved it with the tests above.

---

## Credits

- Fonts: [Shrikhand](https://fonts.google.com/specimen/Shrikhand) and [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- Design, leopard spots, swirls, icon and frames: made by me in Figma, FigJam and Canva
- Admin filter preview image: "Bliss" (Windows XP wallpaper) by Charles O'Rear / Microsoft
- Built with [Vue](https://vuejs.org) and [Appwrite](https://appwrite.io)

### Compile and Minify for Production

```sh
npm run build
```
