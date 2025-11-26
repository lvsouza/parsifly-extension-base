// typedoc.cjs
/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  // 1. Entrada e Saída
  entryPoints: ["./src/index.ts", "./src/web-view/index.ts"],
  out: "./docs",

  // 2. Plugins
  // Adicione o plugin de frontmatter e o seu script local (veja Passo 3)
  plugin: [
    "typedoc-plugin-markdown",
    "typedoc-plugin-frontmatter",
    "typedoc-plugin-mdn-links",
    "typedoc-plugin-include-example",
    "typedoc-plugin-language-switcher",
    "./typedoc/typedoc-custom-frontmatter.cjs" // Script para lógica dinâmica
  ],

  readme: "none",

  // Limpeza visual
  hidePageHeader: true,

  // 5. Configuração Estática do Frontmatter (Opcional)
  // Use isso apenas para valores fixos. Para dinâmicos, usamos o script local.
  frontmatterGlobals: {
    generatedBy: "TypeDoc",
    category: 'API Reference',
  },
};