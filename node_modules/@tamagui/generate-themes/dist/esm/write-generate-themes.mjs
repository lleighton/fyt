import * as fs from "fs-extra";
async function writeGeneratedThemes(tamaguiDotDir, outPath, generatedOutput) {
  if (!generatedOutput) return;
  const {
    generated
  } = generatedOutput;
  process.env.DEBUG === "tamagui" && console.info("Generated themes:", JSON.stringify(generatedOutput, null, 2));
  const newContent = `// @ts-nocheck
` + generated;
  (await fs.readFile(outPath, "utf-8").catch(() => null)) !== newContent && (await fs.writeFile(outPath, newContent));
}
export { writeGeneratedThemes };
//# sourceMappingURL=write-generate-themes.mjs.map
