import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * This script is run automatically after the contract is compiled.
 * It copies all contract ABIs (the instruction manuals) from the 'artifacts'
 * folder into the 'abis' folder at the project root, so our Next.js API routes can
 * easily import them and know how to talk to the contracts.
 */
function main(): void {
  // Get __dirname equivalent for ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Define paths
  const artifactsDir = path.join(__dirname, '../artifacts/contracts');
  const destDir = path.join(__dirname, '../abis');

  // Ensure the destination directory exists
  if (!fs.existsSync(destDir)) {
    console.log(`Creating directory: ${destDir}`);
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Check if artifacts directory exists
  if (!fs.existsSync(artifactsDir)) {
    console.error(`Error: Artifacts directory not found at ${artifactsDir}`);
    console.error('Make sure you run "npx hardhat compile" first.');
    process.exit(1);
  }

  // Find all contract artifact directories
  const contractDirs = fs
    .readdirSync(artifactsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name.endsWith('.sol'))
    .map((dirent) => dirent.name);

  if (contractDirs.length === 0) {
    console.warn('⚠️  No contract artifacts found. Make sure contracts are compiled.');
    return;
  }

  let copiedCount = 0;

  // Process each contract directory
  for (const contractDir of contractDirs) {
    const contractArtifactsPath = path.join(artifactsDir, contractDir);

    // Find all JSON files in the contract directory (excluding TypeScript definition files)
    const jsonFiles = fs
      .readdirSync(contractArtifactsPath)
      .filter((file) => file.endsWith('.json') && !file.endsWith('.d.ts.json'));

    // Copy each JSON file (ABI artifact)
    for (const jsonFile of jsonFiles) {
      const sourcePath = path.join(contractArtifactsPath, jsonFile);
      const destPath = path.join(destDir, jsonFile);

      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${jsonFile} from ${contractDir}`);
        copiedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error copying ${jsonFile}:`, errorMessage);
      }
    }
  }

  if (copiedCount > 0) {
    console.log(`\n🎉 Successfully copied ${copiedCount} ABI file(s) to ${destDir}`);
  } else {
    console.warn('⚠️  No ABI files were copied.');
  }
}

// Run the script
try {
  main();
} catch (error) {
  // This will catch any errors, like if the 'artifacts' folder doesn't exist
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Error copying ABI:', errorMessage);
  process.exit(1);
}
