#!/usr/bin/env node
/**
 * aws-arch-drawio-plugin
 * Claude Code plugin entry point — generates Draw.io architecture diagrams
 * from AWS IaC code (CloudFormation, CDK, Terraform, SAM).
 *
 * Usage (called by Claude Code via skill):
 *   node dist/index.js [--file <path>] [--style minimal|standard|detailed]
 *                      [--backend lgazo|sujimoshi|official] [--live] [--layers]
 */

import { runDiagramCommand, type DiagramCommandOptions } from './commands/diagram.js';
import { logger } from './utils/logger.js';

function parseArgs(argv: string[]): DiagramCommandOptions {
  const opts: DiagramCommandOptions = {};
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--file':     opts.file    = argv[++i]; break;
      case '--style':    opts.style   = argv[++i] as DiagramCommandOptions['style']; break;
      case '--backend':  opts.backend = argv[++i] as DiagramCommandOptions['backend']; break;
      case '--profile':  opts.profile = argv[++i]; break;
      case '--region':   opts.region  = argv[++i]; break;
      case '--update':   opts.update  = argv[++i]; break;
      case '--export':   opts.export  = argv[++i]; break;
      case '--live':     opts.live    = true; break;
      case '--layers':   opts.layers  = true; break;
      case '--no-layers': opts.layers = false; break;
    }
  }
  return opts;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  const rootDir = process.env['PROJECT_ROOT'] ?? process.cwd();

  try {
    const result = await runDiagramCommand(rootDir, options);
    process.stdout.write(result + '\n');
  } catch (err) {
    logger.error('Failed to generate diagram', err);
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

main();
