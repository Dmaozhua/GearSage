const { spawn } = require('child_process');
const path = require('path');

/**
 * Phase 1 Orchestrator: Daiwa Reels
 * 
 * This Node.js script acts as the orchestrator to execute the Scrapling (Python) scraper.
 * It triggers the extraction of product detail URLs from the Daiwa reel list page.
 */

const PYTHON_ENV = path.resolve(__dirname, '../../../venv/bin/python');
const SCRAPER_SCRIPT = path.resolve(__dirname, 'reel.py');

console.log('[Orchestrator] Starting Phase 1: Daiwa Reel List Extraction...');

const pythonProcess = spawn(PYTHON_ENV, [SCRAPER_SCRIPT]);

pythonProcess.stdout.on('data', (data) => {
    process.stdout.write(`[Scraper] ${data.toString()}`);
});

pythonProcess.stderr.on('data', (data) => {
    process.stderr.write(`[Scraper Error] ${data.toString()}`);
});

pythonProcess.on('close', (code) => {
    if (code === 0) {
        console.log('[Orchestrator] Phase 1 completed successfully.');
        console.log(`[Orchestrator] Next step: Fetch individual detail pages and parse them (Phase 2).`);
    } else {
        console.error(`[Orchestrator] Scraper process exited with code ${code}`);
    }
});
