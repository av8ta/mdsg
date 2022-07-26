#!/usr/bin/env node
import { render } from './index.js'
import { join } from 'path'

render(join(process.cwd(), 'input'), join(process.cwd(), 'output'), false)
// render(join(process.cwd(), 'node_modules'), join(process.cwd(), 'output'), true)
