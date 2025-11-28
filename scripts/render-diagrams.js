#!/usr/bin/env node

/**
 * Script to render all Mermaid diagrams to images
 * Usage: node scripts/render-diagrams.js [format] [theme] [output-dir] [scale]
 *
 * Available themes: default, dark, neutral, forest, base
 * Scale: Resolution multiplier for PNG output (default: 2, higher = better quality but larger files)
 *
 * Examples:
 *   node scripts/render-diagrams.js png
 *   node scripts/render-diagrams.js svg dark
 *   node scripts/render-diagrams.js png neutral diagrams/output
 *   node scripts/render-diagrams.js png dark diagrams 3
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const format = process.argv[2] || 'png';
const theme = process.argv[3] || 'dark';
const outputDir = process.argv[4] || 'diagrams';
const scale = parseFloat(process.argv[5]) || (format.toLowerCase() === 'png' ? 2 : 1);

// Validate format
const validFormats = ['png', 'svg', 'pdf'];
if (!validFormats.includes(format.toLowerCase())) {
  console.error(`Error: Invalid format "${format}". Valid formats: ${validFormats.join(', ')}`);
  process.exit(1);
}

// Validate theme
const validThemes = ['default', 'dark', 'neutral', 'forest', 'base'];
if (!validThemes.includes(theme.toLowerCase())) {
  console.error(`Error: Invalid theme "${theme}". Valid themes: ${validThemes.join(', ')}`);
  process.exit(1);
}

// Get the project root directory
const projectRoot = process.cwd();

// Ensure output directory exists
const outputPath = path.join(projectRoot, outputDir);
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Find all .mmd files recursively in the diagrams directory
function findMmdFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMmdFiles(fullPath));
    } else if (entry.name.endsWith('.mmd')) {
      files.push(fullPath);
    }
  }

  return files;
}

const diagramsDir = path.join(projectRoot, 'diagrams');
if (!fs.existsSync(diagramsDir)) {
  console.error(`Error: Diagrams directory not found: ${diagramsDir}`);
  process.exit(1);
}

const mmdFiles = findMmdFiles(diagramsDir);

if (mmdFiles.length === 0) {
  console.error('Error: No .mmd files found in diagrams directory');
  process.exit(1);
}

console.log(`Found ${mmdFiles.length} diagram(s) to render...`);
console.log(`Format: ${format}, Theme: ${theme}${format.toLowerCase() === 'png' ? `, Scale: ${scale}x` : ''}\n`);

// Render each diagram
let successCount = 0;
let failCount = 0;

mmdFiles.forEach((inputFile) => {
  // Preserve directory structure in output
  const relativePath = path.relative(diagramsDir, inputFile);
  const dirName = path.dirname(relativePath);
  const fileName = path.basename(inputFile, '.mmd');

  const outputDir = dirName !== '.' ? path.join(outputPath, dirName) : outputPath;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `${fileName}.${format}`);

  try {
    console.log(`Rendering ${fileName}...`);

    // Build mmdc command with theme, scale (for PNG), and transparent background (for PNG)
    let mmdcCommand = `npx mmdc -i "${inputFile}" -o "${outputFile}" -t ${theme}`;
    if (format.toLowerCase() === 'png') {
      mmdcCommand += ` --backgroundColor transparent`;
      if (scale > 1) {
        mmdcCommand += ` -s ${scale}`;
      }
    }

    // Use mmdc to render the diagram with specified theme and scale
    execSync(mmdcCommand, {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    console.log(`✓ ${fileName}.${format}\n`);
    successCount++;
  } catch (error) {
    console.error(`✗ Failed to render ${fileName}: ${error.message}\n`);
    failCount++;
  }
});

// Summary
console.log('='.repeat(50));
console.log(`Rendering complete!`);
console.log(`  Success: ${successCount}`);
console.log(`  Failed:  ${failCount}`);
console.log(`  Output:  ${outputPath}`);

if (failCount > 0) {
  process.exit(1);
}
