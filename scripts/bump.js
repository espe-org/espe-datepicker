const { writeFile } = require('fs/promises');
const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

const green = "\x1b[32m";
const reset = "\x1b[0m";

const currentYear = new Date().getFullYear();
let newVersion = `${currentYear}.1`;

if (/^\d+\.\d+$/.test(packageJson.version)) {
  let [year, release] = packageJson.version.split('.').map(Number);

  if (year === currentYear) {
    newVersion = `${year}.${release + 1}`;
  }
}

packageJson.version = newVersion;

(async () => {
    try {
        await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
        console.log(`Version updated to: ${green}${newVersion}${reset}`);
        
        await exec(`git add ${packageJsonPath}`);
        await exec(`git commit -m "Update version to ${newVersion}"`);
        
        const tag = `v${newVersion}`;
        await exec(`git tag ${tag}`);
        
        await exec('git push');
        await exec(`git push origin ${tag}`);

        console.log(`Tag ${green}${tag}${reset} pushed to remote repository.`);
    } catch (err) {
        console.error('Error:', err);
    }
})();
