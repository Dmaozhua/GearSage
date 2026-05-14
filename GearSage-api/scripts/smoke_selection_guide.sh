#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:3101}"

post_selection() {
  label="$1"
  payload="$2"
  echo "== ${label}"
  curl -sS -X POST "${BASE_URL}/mini/recommend/selection" \
    -H 'Content-Type: application/json' \
    -d "${payload}" \
    | node -e '
      let input = "";
      process.stdin.on("data", chunk => input += chunk);
      process.stdin.on("end", () => {
        const response = JSON.parse(input);
        const data = response.data || {};
        const branches = Array.isArray(data.branches) ? data.branches : [];
        console.log(JSON.stringify({
          code: response.code,
          sessionId: data.sessionId || null,
          branchCount: branches.length,
          firstGear: branches[0] && branches[0].primaryGear ? branches[0].primaryGear.gearLabel : "",
          missingFields: data.missingFields || [],
          emptyReason: data.emptyReason || ""
        }, null, 2));
        if (response.code !== 0) process.exit(1);
      });
    '
}

post_selection "casting M / 1200 / bass / wild river" '{"gearCategory":"rod","rodType":"casting","power":"M","budgetMax":1200,"targetFish":["鲈鱼"],"useScene":["野河"],"technique":["unknown"],"carePriorities":["泛用"],"source":"gear_list","limit":3}'
post_selection "spinning L / 800 / stream small fish" '{"gearCategory":"rod","rodType":"spinning","power":"L","budgetMax":800,"targetFish":["马口"],"useScene":["溪流"],"technique":["hardbait"],"carePriorities":["轻量"],"source":"gear_list","limit":3}'
post_selection "missing required fields" '{"gearCategory":"rod"}'
post_selection "unsupported category" '{"gearCategory":"reel","budgetMax":1000,"targetFish":["鲈鱼"],"useScene":["野河"],"source":"gear_list"}'
