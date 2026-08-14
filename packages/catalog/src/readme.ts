const README_TEXT_MIN = 80;

export function isSubstantialDocumentation(text: string | null | undefined): text is string {
  if (!text) return false;
  const stripped = text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length >= README_TEXT_MIN;
}

export function firstPlainParagraph(readme: string): string {
  const withoutMarkup = readme
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\|.*$/gm, "")
    .replace(/\[![^\]]*]\([^)]+\)/g, " ");
  const paragraph = withoutMarkup
    .split(/\n\s*\n/)
    .map(block => block.replace(/\s+/g, " ").trim())
    .find(block => block.length >= 40);
  return paragraph?.slice(0, 320) ?? "";
}
