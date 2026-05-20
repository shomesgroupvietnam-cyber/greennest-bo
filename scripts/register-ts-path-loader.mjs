import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-path-loader.mjs", pathToFileURL(`${process.cwd()}/scripts/`));
