const path = require('path');
const { execFileSync } = require('child_process');

const SHADE_SCRIPT = path.join(__dirname, 'shade_megabass_rod_detail_groups_stage2.py');

function runMegabassRodDetailGroupShading() {
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });
}

module.exports = {
  runMegabassRodDetailGroupShading,
};
