// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    name: 'allow-index-pages',
    files: ['*/index.vue', 'app.vue'], 
    rules: {
      'vue/multi-word-component-names': 'off',
    },

  },
 { 
  name: 'import-first-on-test' ,
  files: ["test/**/*.{js,ts}"],
  rules: { "import/first": "off" }
 }
)