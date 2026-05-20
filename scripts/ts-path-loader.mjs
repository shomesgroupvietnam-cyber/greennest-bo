import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/headers") {
    return nextResolve("next/headers.js", context);
  }

  if (specifier.startsWith("@/")) {
    return resolveFile(path.join(root, "src", specifier.slice(2)));
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parentPath = fileURLToPath(context.parentURL);
    return resolveFile(path.resolve(path.dirname(parentPath), specifier));
  }

  return nextResolve(specifier, context);
}

function resolveFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js")
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    return { url: pathToFileURL(basePath).href, shortCircuit: true };
  }

  return { url: pathToFileURL(found).href, shortCircuit: true };
}
