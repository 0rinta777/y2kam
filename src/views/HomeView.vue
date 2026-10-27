<script setup>
import { useAuth } from '@/composables/useAuth'
// Swirl decoration from the Figma home page
import swirl from '@/assets/swirl-flourish.svg'

// Only used to greet the user by name
const { user, isLoggedIn } = useAuth()
</script>

<template>
  <!-- Landing page from the Figma "home" frame -->
  <main class="home">
    <!-- Glowing swirls in the corners, just decoration -->
    <img :src="swirl" alt="" class="swirl swirl-top" aria-hidden="true" />
    <img :src="swirl" alt="" class="swirl swirl-bottom" aria-hidden="true" />

    <h1 class="logo">y2kam</h1>

    <p v-if="isLoggedIn" class="tagline">hey {{ user.name }} &lt;3 ready for your close up?</p>
    <p v-else class="tagline">keep the memory looking as good as you do</p>

    <RouterLink to="/booth" class="btn-primary start">start</RouterLink>

    <p v-if="isLoggedIn" class="sub">
      revisit your strips in <RouterLink to="/gallery">my gallery</RouterLink>
    </p>
    <p v-else class="sub">already a user? <RouterLink to="/login">log in</RouterLink></p>
  </main>
</template>

<style scoped>
.home {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-height: calc(100svh - 180px);
  text-align: center;
}

/* The big glowing logo */
.logo {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0.05em 0.2em 0.2em;
  font-size: clamp(84px, 15vw, 190px);
  line-height: 1.15;
  filter: drop-shadow(0 0 26px rgba(199, 125, 255, 0.95));
  animation: glow 3s ease-in-out infinite alternate;
}

/* The logo glow softly pulses */
@keyframes glow {
  to {
    filter: drop-shadow(0 0 40px rgba(230, 190, 255, 1));
  }
}

.tagline {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: clamp(17px, 2.2vw, 22px);
  font-weight: 500;
  text-wrap: balance; /* no single word alone on the last line */
  color: #ffffff;
}

.start {
  position: relative;
  z-index: 1;
  min-width: 140px;
  padding: 14px 44px;
  font-size: 18px;
  background: linear-gradient(180deg, #d08bff 0%, #b763ea 50%, #7b2fc9 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 14px rgba(199, 125, 255, 0.85);
  overflow: hidden;
  transition: transform 0.15s;
}

.start:hover {
  transform: scale(1.05);
}

.sub {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 15px;
  color: #dcc9ff;
}

.sub a {
  font-weight: 700;
  color: #f2b8ff;
}

/* ---- Swirls: fixed in the screen corners, behind the text ---- */
.swirl {
  position: fixed;
  z-index: 0;
  width: clamp(220px, 28vw, 440px);
  height: auto;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(243, 233, 255, 0.85))
    drop-shadow(0 0 22px rgba(199, 125, 255, 0.7));
}

/* top right: hangs down along the right edge, curls at the bottom */
.swirl-top {
  top: 30px;
  right: -130px;
  transform: rotate(125deg);
}

/* bottom left: grows up along the left edge, curls at the top */
.swirl-bottom {
  bottom: -40px;
  left: -120px;
  transform: rotate(-55deg);
}

/* Phones: smaller and softer swirls so the text stays readable */
@media (max-width: 700px) {
  .swirl {
    width: 52vw;
    opacity: 0.55;
  }
  .swirl-top {
    top: 56px;
    right: -60px;
  }
  .swirl-bottom {
    left: -60px;
    bottom: -40px;
  }
}
</style>
