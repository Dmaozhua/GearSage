const { spawn } = require('child_process');
const path = require('path');

/**
 * Phase 2 Orchestrator: Daiwa Reels Detail
 * 
 * This Node.js script executes the Python scraper to process the extracted URLs
 * and generate the standardized normalized.json output.
 */

const PYTHON_ENV = path.resolve(__dirname, '../../../venv/bin/python');
const SCRAPER_SCRIPT = path.resolve(__dirname, 'reel_detail.py');

console.log('[Orchestrator] Starting Phase 2: Daiwa Reel Details Extraction...');

const pythonProcess = spawn(PYTHON_ENV, [SCRAPER_SCRIPT]);

pythonProcess.stdout.on('data', (data) => {
    process.stdout.write(`[Scraper] ${data.toString()}`);
});

pythonProcess.stderr.on('data', (data) => {
    process.stderr.write(`[Scraper Error] ${data.toString()}`);
});

pythonProcess.on('close', (code) => {
    if (code === 0) {
        console.log('[Orchestrator] Phase 2 completed successfully.');
        console.log(`[Orchestrator] Next step: Run pre-check.js to validate normalized data (Phase 3).`);
    } else {
        console.error(`[Orchestrator] Scraper process exited with code ${code}`);
    }
});
