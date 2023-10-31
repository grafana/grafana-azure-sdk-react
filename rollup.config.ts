import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { externals } from 'rollup-plugin-node-externals';
import pkg from './package.json' assert { type: 'json' };

const packagePath = './package.json';

export default [
  {
    input: 'src/index.ts',
    plugins: [
      externals({
        deps: true,
        include: ['react', '@grafana/data', '@grafana/ui', '@grafana/runtime', 'lodash'],
        packagePath,
      }),
      resolve(),
      esbuild(),
    ],
    output: [
      {
        format: 'cjs',
        sourcemap: true,
        dir: path.dirname(pkg.main),
      },
      {
        format: 'esm',
        sourcemap: true,
        dir: path.dirname(pkg.module),
        preserveModules: true,
      },
    ],
  },
  {
    input: './compiled/index.d.ts',
    plugins: [dts()],
    output: {
      file: pkg.types,
      format: 'es',
    },
    watch: {
      exclude: './compiled/**',
    },
  },
];
