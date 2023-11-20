import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'bin.js',
  output: {
    format: 'cjs',
    file: 'dist/bin.cjs'
  },
  plugins: [
    nodeResolve(),
    commonjs(), 
  ]
}
