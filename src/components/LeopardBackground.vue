<script setup>
// Leopard print spots around the edges of the page (decoration only).
// The 10 spots are exported from the Figma design (src/assets/leopard).
import spot1 from '@/assets/leopard/spot1.svg'
import spot2 from '@/assets/leopard/spot2.svg'
import spot3 from '@/assets/leopard/spot3.svg'
import spot4 from '@/assets/leopard/spot4.svg'
import spot5 from '@/assets/leopard/spot5.svg'
import spot6 from '@/assets/leopard/spot6.svg'
import spot7 from '@/assets/leopard/spot7.svg'
import spot8 from '@/assets/leopard/spot8.svg'
import spot9 from '@/assets/leopard/spot9.svg'
import spot10 from '@/assets/leopard/spot10.svg'

// Each spot with its size from Figma: [image, width, height]
const images = [
  [spot1, 50, 78],
  [spot2, 48, 42],
  [spot3, 35, 56],
  [spot4, 37, 50],
  [spot5, 42, 44],
  [spot6, 37, 45],
  [spot7, 51, 33],
  [spot8, 38, 42],
  [spot9, 41, 38],
  [spot10, 34, 44],
]

// [image number, left %, top %, scale, rotation deg, opacity]
// Big spots near the corners, smaller ones further in.
// Fixed list, so the pattern looks random but never jumps around.
const layout = [
  // top left
  [0, 2, 7, 1.5, -18, 0.7],
  [1, 9, 16, 1, 30, 0.6],
  [2, 3, 28, 0.8, 70, 0.5],
  [3, 15, 5, 0.7, -40, 0.45],
  // top right
  [4, 93, 8, 1.6, 22, 0.7],
  [5, 86, 18, 1, -30, 0.6],
  [6, 96, 29, 0.8, 60, 0.5],
  [7, 80, 6, 0.7, 10, 0.45],
  // middle edges
  [8, 1, 50, 1, -10, 0.5],
  [9, 6, 61, 0.7, 45, 0.45],
  [0, 96, 48, 0.9, 15, 0.5],
  [1, 91, 58, 0.7, -50, 0.45],
  // bottom left
  [2, 3, 83, 1.6, 20, 0.7],
  [3, 12, 91, 1, -35, 0.6],
  [4, 2, 71, 0.8, 80, 0.5],
  [5, 19, 96, 0.7, 0, 0.45],
  // bottom right
  [6, 91, 85, 1.5, -25, 0.7],
  [7, 84, 93, 1, 40, 0.6],
  [8, 97, 73, 0.8, -60, 0.5],
  [9, 77, 96, 0.7, 12, 0.45],
]

const spots = layout.map(([n, left, top, scale, rotate, opacity]) => {
  const [src, w, h] = images[n]
  return { src, left, top, w: w * scale, h: h * scale, rotate, opacity, small: scale < 0.9 }
})
</script>

<template>
  <div class="leopard" aria-hidden="true">
    <img
      v-for="(s, i) in spots"
      :key="i"
      :src="s.src"
      alt=""
      class="spot"
      :class="{ small: s.small }"
      :style="{
        left: s.left + '%',
        top: s.top + '%',
        width: s.w + 'px',
        height: s.h + 'px',
        opacity: s.opacity,
        transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
      }"
    />
  </div>
</template>

<style scoped>
/* Fixed layer behind everything, can't be clicked */
.leopard {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.spot {
  position: absolute;
  max-width: none;
  filter: drop-shadow(0 0 6px rgba(215, 184, 255, 0.45));
}
/* Phones: fewer and smaller spots so the content stays readable */
@media (max-width: 700px) {
  .spot {
    scale: 0.6;
  }
  .spot.small {
    display: none;
  }
}
</style>
