// src/app/shared/optimize-image/optimize-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// project root (од optimize-image до root е ../../../../)
const projectRoot = path.resolve(__dirname, "../../../../");

const srcDir = path.join(projectRoot, "src/assets/images");
const outDir = srcDir;

const widthsBg = [640, 960, 1280, 1600, 1920];
const widthsImg = [480, 800, 1200];

// само оригинали (jpg/png), и прескокни веќе-генерирани xxx-960.webp итн.
const isOriginalRaster = (f) =>
  /\.(jpe?g|png)$/i.test(f) && !/-\d+\.(jpe?g|png)$/i.test(f);

if (!fs.existsSync(srcDir)) {
  console.error("Missing folder:", srcDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(isOriginalRaster);

for (const file of files) {
  const full = path.join(srcDir, file);
  const base = file.replace(/\.(jpe?g|png)$/i, "");

  // што да се третира како “bg/hero/carousel” (големи ширини)
  const isBgCandidate = [
    "night",
    "notebook",
    "dumbbell",
    "business",
    "desk",
    "map-image",
    "coffee",
    "keyboard",
    "about",
    "how-it-works-background"
  ].some((k) => base.toLowerCase().includes(k));

  const targets = isBgCandidate ? widthsBg : widthsImg;

  const img = sharp(full).rotate();

  for (const w of targets) {
    await img
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(outDir, `${base}-${w}.webp`));

    await img
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .avif({ quality: 55 })
      .toFile(path.join(outDir, `${base}-${w}.avif`));
  }

  // default fallback webp (без -w)
  await img.clone().webp({ quality: 78 }).toFile(path.join(outDir, `${base}.webp`));

  console.log("Optimized:", file);
}

console.log("Done.");
