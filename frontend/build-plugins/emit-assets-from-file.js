import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';

export const emitAssetsFromFile = (assetsFile) => {
  const fileName = path.resolve(assetsFile);
  let assetFileFound = false;
  return {
    name: 'emit-assets',
    async load(id) {
      if (id === fileName) {
        assetFileFound = true;
        const getAssets = new Function(
          'module',
          'exports',
          (await (await rollup({ input: fileName })).generate({ format: 'cjs' })).output[0].code
        );
        const module = { exports: {} };
        getAssets(module, module.exports);
        return Object.keys(module.exports)
          .map((assetKey) => {
            const assetFileName = path.resolve(module.exports[assetKey]);
            const source = fs.readFileSync(path.resolve(assetFileName));
            return `export const ${assetKey} = import.meta.ROLLUP_FILE_URL_${this.emitFile({
              type: 'asset',
              source,
              name: path.basename(assetFileName),
            })};`;
          })
          .join('\n');
      }
    },
    buildEnd() {
      if (assetFileFound === false) {
        throw new Error(`Build script could not find assets file "${fileName}"`);
      }
    },
  };
};