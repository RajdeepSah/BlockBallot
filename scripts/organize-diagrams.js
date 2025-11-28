#!/usr/bin/env node

/**
 * Script to organize diagram files into categorized folders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = process.cwd();
const diagramsDir = path.join(projectRoot, 'diagrams');

// Define organization structure
const organization = {
  flows: [
    'auth-flow.mmd',
    'registration-flow.mmd',
    'token-refresh-flow.mmd',
    'voting-flow.mmd',
    'election-creation-flow.mmd',
    'election-search-flow.mmd',
    'eligibility-management-flow.mmd',
    'access-request-approval-flow.mmd',
    'election-invite-flow.mmd',
    'results-retrieval-flow.mmd',
    'error-handling-flow.mmd',
    'security-flow.mmd',
    'complete-state-machine.mmd',
  ],
  architecture: [
    'system-architecture.mmd',
    'component-structure.mmd',
    'api-endpoints.mmd',
    'use-case.mmd',
  ],
  data: ['data-model.mmd', 'data-flow.mmd', 'database-schema.mmd'],
};

// Create directories
Object.keys(organization).forEach((dir) => {
  const dirPath = path.join(diagramsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Move files
let movedCount = 0;
for (const [category, files] of Object.entries(organization)) {
  const targetDir = path.join(diagramsDir, category);

  for (const file of files) {
    const sourcePath = path.join(diagramsDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
      try {
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved: ${file} -> ${category}/`);
        movedCount++;
      } catch (error) {
        console.error(`Failed to move ${file}:`, error.message);
      }
    }
  }
}

console.log(`\nOrganized ${movedCount} diagram files.`);
