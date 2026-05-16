import { rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

for (const directory of ["out", ".next"]) {
  rmSync(join(root, directory), { force: true, recursive: true });
}
