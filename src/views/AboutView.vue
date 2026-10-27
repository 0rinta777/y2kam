<script setup>
import ContactForm from '@/components/ContactForm.vue'
</script>

<template>
  <main class="about">
    <h1>about y2kam</h1>

    <section>
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
}
/* Title across the top, like the gallery and wall */
.about > h1 {
  grid-column: 1 / -1;
  margin-bottom: 0;
}
/* About text and contact form as two glass cards */
.about section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px;
  background: rgba(30, 8, 56, 0.74);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 30px rgba(157, 77, 230, 0.35);
  backdrop-filter: blur(12px);
}
.about section p {
  margin: 0;
  font-size: 17px;
  color: #eadcff;
}
.about h2 {
  margin: 0;
}
.about :deep(form),
.about :deep(.sent) {
  max-width: none;
}

/* Laptop/desktop: a bit more compact, so everything fits without scrolling */
@media (min-width: 801px) {
  .about {
    gap: 20px;
    margin-bottom: -60px; /* skip the page's empty bottom space */
  }
  .about > h1 {
    font-size: 40px;
  }
  .about section {
    gap: 10px;
    padding: 24px 28px;
  }
  .about section p {
    font-size: 16px;
  }
  /* smaller message box in the contact form */
  .about :deep(textarea) {
    height: 90px;
  }
  .about :deep(form) {
    gap: 8px;
  }
}

@media (min-width: 801px) {
  .about {
    gap: 20px;
    margin-top: -8px;
    margin-bottom: -60px; /* skip the page's empty bottom space */
  }
}

@media (max-width: 800px) {
  .about {
    grid-template-columns: 1fr;
  }
  .about section {
    padding: 22px;
  }
}
</style>
