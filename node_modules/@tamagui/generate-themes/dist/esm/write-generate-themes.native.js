import * as fs from "fs-extra";
async function writeGeneratedThemes(tamaguiDotDir, outPath, generatedOutput) {
  if (generatedOutput) {
    var {
      generated
    } = generatedOutput;
    process.env.DEBUG === "tamagui" && console.info("Generated themes:", JSON.stringify(generatedOutput, null, 2));
    var newContent = `// @ts-nocheck
` + generated,
      existingContent = await fs.readFile(outPath, "utf-8").catch(function () {
        return null;
      });
    existingContent !== newContent && (await fs.writeFile(outPath, newContent));
  }
}
export { writeGeneratedThemes };
//# sourceMappingURL=write-generate-themes.native.js.map
