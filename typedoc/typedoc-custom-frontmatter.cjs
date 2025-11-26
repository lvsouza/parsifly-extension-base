// typedoc-custom-frontmatter.cjs
const { MarkdownPageEvent } = require('typedoc-plugin-markdown');

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
exports.load = (app) => {

  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    // Lógica para Título
    const title = page.model?.name || "API Docs";

    // Lógica para Descrição
    let description = "Documentation API";
    if (page.model?.comment?.summary?.length > 0) {
      description = page.model.comment.summary
        .map(s => s.text)
        .join("")
        .replace(/\n/g, ' ')
        .replace(/"/g, "'"); // Evitar quebra de YAML
    } else if (page.model) {
      description = `Documentation for ${page.model.name} (${page.model.kind})`;
    }

    // Lógica para Slug
    const slug = "/" + page.url.replace('.mdx', '').toLowerCase();

    // Atualiza o frontmatter da página
    page.frontmatter = {
      ...page.frontmatter, // Mantém o que já existe
      slug: slug,
      title: title,
      description: description,
    };
  });

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (!page.contents) return;

    // Regex explica:
    // 1. (\[[^\]]+\]\([^)]+?) -> Pega a parte "[Texto](caminho"
    // 2. (\.mdx?)           -> Pega a extensão .md ou .mdx
    // 3. ((?:#[^)]+)?\))    -> Pega âncoras opcionais (#algo) e o fecha parênteses ")"
    const linkRegex = /(\[[^\]]+\]\([^)]+?)(\.mdx?)((?:#[^)]+)?\))/g;

    page.contents = page.contents.replace(linkRegex, (match, prefix, ext, suffix) => {
      // Ignora links externos (http/https)
      if (prefix.includes("http://") || prefix.includes("https://")) {
        return match;
      }
      // Retorna o link sem a extensão (ext), mas mantendo a âncora e o parêntese final
      return `${prefix}${suffix}`;
    });
  });
};