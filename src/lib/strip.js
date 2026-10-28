import { applyEffects } from '@/lib/filters'

// Fixed strip size. Every frame image must be designed at exactly this size.
export const STRIP_W = 600
export const STRIP_H = 1800

const PAD = 30 // white border around the photos
const GAP = 20 // space between photos
const PHOTO_W = STRIP_W - PAD * 2 // 540
const PHOTO_H = 405 // 4:3 photos

// Build one strip canvas from 4 photo canvases
// (+ optional frame image URL, + the filter's extra effects like tint/grain/vignette)
export async function buildStrip(photos, frameUrl = null, effects = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = STRIP_W
  canvas.height = STRIP_H
  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, STRIP_W, STRIP_H)

  // Draw the photos one under another
  photos.forEach((photo, i) => {
    const y = PAD + i * (PHOTO_H + GAP)
    drawCover(ctx, photo, PAD, y, PHOTO_W, PHOTO_H)
    applyEffects(ctx, PAD, y, PHOTO_W, PHOTO_H, effects)
  })

  // Frame with fixed stickers goes on top
  if (frameUrl) {
    const frame = await loadImage(frameUrl)
    ctx.drawImage(frame, 0, 0, STRIP_W, STRIP_H)
  }

  return canvas
}

// Draw an image so it fills the box, cropping the edges (like CSS object-fit: cover)
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

// Load an image from a URL. crossOrigin lets us export the canvas later
// (without it, images from Appwrite would block toBlob()).
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// Turn a canvas into an image file we can upload to Appwrite Storage
export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
}
