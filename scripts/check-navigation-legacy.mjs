import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const allowedExtensions = new Set([".ts", ".tsx"]);

const bannedPatterns = [
  {
    label: 'Legacy internal anchor via `component="a"`',
    regex: /component="a"/g,
  },
  {
    label: "Raw anchor element via `<a href=`",
    regex: /<a\s+href=/g,
  },
  {
    label: "Legacy ScreenSection or EmptyStateCard action props via `actionHref`",
    regex: /\bactionHref=/g,
  },
  {
    label: "Legacy ScreenSection or EmptyStateCard action props via `actionLabel`",
    regex: /\bactionLabel=/g,
  },
  {
    label: "Document navigation via `window.location`",
    regex: /\bwindow\.location\b/g,
  },
  {
    label: "Document navigation via `location.href`",
    regex: /\blocation\.href\b/g,
  },
];

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatFinding(filePath, lineNumber, label, line) {
  const relativePath = path.relative(projectRoot, filePath).replaceAll("\\", "/");
  return `- ${relativePath}:${lineNumber} ${label}\n  ${line.trim()}`;
}

async function main() {
  const files = await collectFiles(srcRoot);
  const findings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const pattern of bannedPatterns) {
        if (pattern.regex.test(line)) {
          findings.push(formatFinding(filePath, index + 1, pattern.label, line));
          pattern.regex.lastIndex = 0;
        }
      }

      for (const pattern of bannedPatterns) {
        pattern.regex.lastIndex = 0;
      }
    });
  }

  if (findings.length > 0) {
    console.error("Navigation legacy check failed.\n");
    console.error(findings.join("\n"));
    process.exit(1);
  }

  console.log("Navigation legacy check passed.");
}

main().catch((error) => {
  console.error("Navigation legacy check crashed.");
  console.error(error);
  process.exit(1);
});
