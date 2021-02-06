import commonjs from "rollup-plugin-commonjs";
import external from "rollup-plugin-peer-deps-external";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";
import nodePolyfills from "rollup-plugin-node-polyfills";

export default {
  input: "src/index.ts",
  output: [
    {
      format: "cjs",
      exports: "named",
      dir: "dist",
    },
  ],
  plugins: [
    nodePolyfills(),
    external(),
    resolve(),
    typescript({ typescript: require("typescript") }),
    commonjs(),
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
};
