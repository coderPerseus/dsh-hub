#!/usr/bin/env node
import { runCli } from "./index.js";
process.exitCode = await runCli(process.argv.slice(2), {
    stdout: value => process.stdout.write(`${value}\n`),
    stderr: value => process.stderr.write(`${value}\n`),
});
