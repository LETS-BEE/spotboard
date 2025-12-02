// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  srcDir: '.',

  runtimeConfig: {
    public: {
      domjudgeApiBaseUrl: process.env.NUXT_PUBLIC_DOMJUDGE_API_BASE_URL || 'https://domjudge.iti.kit.edu/main/api/v4',
      domjudgeContestId: process.env.NUXT_PUBLIC_DOMJUDGE_CONTEST_ID || 'nwerc2019', // Default to a demo contest
    }
  }
})
