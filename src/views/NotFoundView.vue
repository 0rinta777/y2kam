<template>
  <main class="not-found">
    <h1>404</h1>
    <p>this page doesn't exist ♥</p>
    <RouterLink to="/">go back home</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 16px;
  text-align: center;
}
.not-found h1 {
  font-size: clamp(90px, 18vw, 180px);
  margin: 0;
}
.not-found p {
  font-size: 20px;
  color: #ffffff;
}
.not-found a {
  font-weight: 700;
}
</style>
