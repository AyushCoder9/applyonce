/** Load the root .env for every workspace command; shell exports take precedence. */
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
const inheritedNodeEnv = process.env.NODE_ENV;
if (existsSync('.env')) loadEnvFile('.env');
// Next and Vitest choose their own lifecycle mode unless explicitly exported.
if (inheritedNodeEnv === undefined) delete process.env.NODE_ENV;
const [command, ...args] = process.argv.slice(2);
if (args.includes('build') || args.includes('start')) process.env.NODE_ENV = 'production';
if (!command) throw new Error('Usage: node scripts/run.mjs <command> [args]');
const child = spawn(command, args, { stdio: 'inherit', env: process.env });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
