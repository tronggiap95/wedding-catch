/**
 * Vite 8 / Rolldown need Node 20.19+ (styleText in node:util).
 * Fail fast with a clear message instead of a cryptic import error.
 */
const [major, minor] = process.versions.node.split('.').map(Number);
const ok =
  major > 20 || (major === 20 && minor >= 19) || major >= 22;

if (!ok) {
  console.error(
    `\n✖ This project needs Node.js >= 20.19 (current: ${process.versions.node}).\n` +
      `  Run:  nvm use\n` +
      `  Then: npm run dev\n`,
  );
  process.exit(1);
}
