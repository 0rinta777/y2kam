<script setup>
import ContactForm from '@/components/ContactForm.vue'
</script>

<template>
  <main class="about">
    <section>
      <h1>about y2kam</h1>

      <p>
        y2kam is a free online photobooth inspired by the early 2000s: glitter, chrome, butterflies
        and grainy webcam pics.
      </p>
      <p>
        take 4 photos with a countdown, add a filter and a frame, and get a classic photo strip.
        save your strips to your own gallery, keep them private or share them on the wall with other
        members.
      </p>
      <p>made with ♥ by orinta as a school project.</p>
    </section>

    <section aria-labelledby="contact-title">
      <h2 id="contact-title">contact us</h2>
      <p>questions, ideas or found a bug? send us a message ♥</p>
      <ContactForm />
    </section>
  </main>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 16px;
  max-width: 720px;
}
</style>
