import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json' assert { type: 'json' };

const libraryName = pkg.name;

const buildCjsPackage = ({ env }: any) => {
  return {
    input: 'src/index.ts',
    output: [
      {
        file: `dist/index.${env}.js`,
        name: libraryName,
        format: 'cjs',
        sourcemap: true,
        chunkFileNames: `[name].${env}.js`,
        strict: false,
        exports: 'named',
        globals: {
          react: 'React',
          'prop-types': 'PropTypes',
        },
      },
    ],
    external: ['react', '@grafana/data', '@grafana/ui'],
    plugins: [
      typescript({
        sourceMap: true,
      }),
      commonjs({
        include: /node_modules/,
      }),
      resolve(),
      env === 'production' && terser(),
    ],
  };
};
export default [buildCjsPackage({ env: 'development' }), buildCjsPackage({ env: 'production' })];
