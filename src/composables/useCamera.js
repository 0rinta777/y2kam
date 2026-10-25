import { ref, computed, onBeforeUnmount } from 'vue'

export function useCamera() {
  const videoEl = ref(null) // connected to the <video> in the template
  const stream = ref(null) // the live camera stream
  const error = ref('')
  const starting = ref(false)
  const isOn = computed(() => !!stream.value)

  // Ask for camera permission and show the webcam in the <video>
  async function start() {
    error.value = ''
    starting.value = true
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      })
      videoEl.value.srcObject = stream.value
      await videoEl.value.play()
    } catch (e) {
      // NotAllowedError = the user (or browser) blocked the camera
      error.value =
        e.name === 'NotAllowedError'
          ? 'camera access was blocked. allow it in your browser settings and try again ♥'
          : "couldn't start the camera. is another app using it?"
    } finally {
      starting.value = false
    }
  }

  // Turn the camera off (so the webcam light goes out)
  function stop() {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null
  }

  // Take a photo: copy the current video frame onto a canvas,
  // mirrored like a selfie, with the chosen filter applied
  function capture(filter = 'none') {
    const video = videoEl.value
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.filter = filter
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    return canvas
  }

  // Always turn the camera off when leaving the page
  onBeforeUnmount(stop)

  return { videoEl, error, starting, isOn, start, stop, capture }
}
