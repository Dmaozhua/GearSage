const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('../../node_modules/xlsx');
const gearDataPaths = require('../../gear_data_paths');

const ROOT = path.resolve(__dirname, '../../..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('megabass_rod_import.xlsx');
const RAW_FILE = gearDataPaths.resolveDataRaw('megabass_rod_raw.json');
const OUT_FILE = gearDataPaths.resolveDataRaw('megabass_rod_whitelist_player_evidence.json');

const TW_SOURCES = [
  {
    series: 'LEVANTE',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Levante_Casting_Rods/descpage-MBLCRD.html',
  },
  {
    series: 'LEVANTE',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Levante_Spinning_Rods/descpage-MBLSRD.html',
  },
  {
    series: 'LEVANTE',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Levante_Multi-Piece_Casting_Rods/descpage-MLMC.html',
  },
  {
    series: 'EVOLUZION',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Destroyer_Evoluzion_Casting_Rods/descpage-MECR.html',
  },
  {
    series: 'OROCHI X10',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Orochi_X10_Casting_Rods/descpage-MBOX10C.html',
  },
  {
    series: 'DESTROYER T.S',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Destroyer_TS_Casting_Rods/descpage-MBDTS.html',
  },
  {
    series: 'TRIZA',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Triza_Travel_3-Piece_Casting_Rod/descpage-MBTC.html',
  },
  {
    series: 'VALKYRIE World Expedition',
    confidence: 'high',
    url: 'https://www.tacklewarehouse.com/Megabass_Valkyrie_World_Expedition_Travel_Casting_Rods/descpage-MBVWE.html',
  },
  {
    series: 'Brand New DESTROYER',
    confidence: 'medium',
    url: 'https://www.tacklewarehouse.com/Megabass_Destroyer_P5_JDM_Casting_Rods/descpage-MBP5C.html',
    note: 'Tackle Warehouse page uses Destroyer P5 JDM naming; match only by exact model code against current Brand New DESTROYER rows.',
  },
  {
    series: 'Brand New DESTROYER',
    confidence: 'medium',
    url: 'https://www.tacklewarehouse.com/Megabass_Destroyer_P5_JDM_Spinning_Rods/descpage-MBP5S.html',
    note: 'Tackle Warehouse page uses Destroyer P5 JDM naming; match only by exact model code against current Brand New DESTROYER rows.',
  },
];

const HUT_SOURCES = [
  {
    series: 'LEVANTE',
    confidence: 'medium',
    url: 'https://thehookuptackle.com/products/levante-casting-rods',
  },
  {
    series: 'LEVANTE',
    confidence: 'medium',
    url: 'https://thehookuptackle.com/products/levante-spinning-rods',
  },
];

const PLAT_SOURCES = [
  {
    series: 'DESTROYER T.S',
    model: 'TS78X',
    confidence: 'medium',
    url: 'https://www.plat.co.jp/shop/catalog/product_info/language/en/products_id/75772/cPath/38_4055_2569/rod/megabass-destroyer-t-s-ts78x.html',
  },
];

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normSku(value) {
  return n(value).toUpperCase().replace(/[^A-Z0-9+]/g, '');
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;|&#8211;/g, '-')
    .replace(/&mdash;|&#8212;/g, '-')
    .replace(/&reg;/g, '')
    .replace(/&trade;/g, '')
    .replace(/&rsquo;|&#8217;/g, "'");
}

function htmlToText(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function fetchUrl(url) {
  return execFileSync('curl', ['-L', '-s', '--max-time', '30', url], {
    encoding: 'latin1',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function loadWorkbookRows() {
  const wb = XLSX.readFile(IMPORT_FILE, { cellDates: false });
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const rodById = new Map(rods.map((row) => [n(row.id), row]));

  const bySeriesSku = new Map();
  for (const row of details) {
    const master = rodById.get(n(row.rod_id));
    const series = n(master?.model);
    const key = `${series}\u0000${normSku(row.SKU)}`;
    if (!bySeriesSku.has(key)) bySeriesSku.set(key, []);
    bySeriesSku.get(key).push({ row, master });
  }

  return { rods, details, bySeriesSku };
}

function rawIndex() {
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const bySeriesSku = new Map();
  for (const item of raw) {
    bySeriesSku.set(`${n(item.series_name)}\u0000${normSku(item.model_name)}`, item);
  }
  return bySeriesSku;
}

function extractLeadText(text) {
  const stop = text.indexOf('Specifications');
  const lead = stop >= 0 ? text.slice(0, stop) : text.slice(0, 2500);
  return lead
    .replace(/\bAdd To Cart\b[\s\S]*$/i, '')
    .split('\n')
    .map(n)
    .filter(Boolean)
    .slice(-20)
    .join(' ')
    .slice(0, 1200);
}

function extractFeatures(text) {
  const lines = text.split('\n').map(n).filter(Boolean);
  const features = [];
  let capture = false;
  for (const line of lines) {
    if (/^Features:?$/i.test(line)) {
      capture = true;
      continue;
    }
    if (capture && /^(Backed by|Specifications|Model)$/i.test(line)) break;
    if (capture) {
      const cleaned = line.replace(/^[-*]\s*/, '');
      if (cleaned) features.push(cleaned);
    }
  }
  return features;
}

function parseTwSpecs(text) {
  const lines = text.split('\n').map(n).filter(Boolean);
  const specs = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] !== 'Specifications') continue;
    const header = lines.slice(i + 1, i + 10);
    if (header.join('|') !== 'Model|Length|Power|Taper|Line Wt.|Lure Wt.|Guides|Handle Length|Handle Type') continue;

    let j = i + 10;
    while (j + 8 < lines.length) {
      if (lines[j] === 'Specifications' || lines[j] === 'Close' || /^More From/i.test(lines[j])) break;
      const row = {
        model: lines[j],
        length: lines[j + 1],
        power: lines[j + 2],
        taper: lines[j + 3],
        line_wt: lines[j + 4],
        lure_wt: lines[j + 5],
        guides: lines[j + 6],
        handle_length: lines[j + 7],
        handle_type: lines[j + 8],
      };
      if (/^[A-Z]*\d|^F\d|^TS\d|^VK[CS]/i.test(row.model)) specs.push(row);
      j += lines[j + 9] === 'Buy Now' ? 10 : 9;
    }
  }
  return specs;
}

function guideHintFromFeatures(features, fallbackText) {
  const source = `${features.join(' / ')} ${fallbackText}`.toLowerCase();
  const parts = [];
  if (/fuji/.test(source) && /alconite/.test(source)) {
    parts.push('Fuji Alconite 导环：耐磨和出线稳定性有外部零售页佐证，适合高频淡水路亚抛投。');
  } else if (/fuji/.test(source) && /guide/.test(source)) {
    parts.push('Fuji 导环：外部零售页佐证其导环配置，后续可人工判断是否补入导环字段。');
  } else if (/guide/.test(source)) {
    parts.push('导环配置：外部零售页提供 guides 数量或材料线索，可辅助人工复核出线和控线描述。');
  }
  if (/hook keeper/.test(source)) parts.push('hook keeper：外部零售页提到随竿配置，可作为人工复核挂钩字段的候选证据。');
  if (/spiral architect/.test(source)) parts.push('Spiral Architect reel seat：外部零售页提到轮座，可辅助复核握持和操控描述。');
  return parts.join(' ');
}

function inferPlayerPositioning(spec) {
  const model = n(spec.model);
  const power = n(spec.power).toLowerCase();
  const taper = n(spec.taper).toLowerCase();
  const lure = n(spec.lure_wt).toLowerCase();
  const maxOz = maxOzValue(lure);

  if (/jerkbait/i.test(model)) return 'jerkbait / 抽停硬饵 / 控线';
  if (/dropshot|drop shot/i.test(model)) return 'drop shot / finesse / 轻线精细';
  if (/swimbait|leviathan|megalathan/i.test(model) || maxOz >= 2) return 'big bait / swimbait / 强力';
  if (/heavy|extra heavy|xx-heavy|x-heavy/.test(power)) return '重障碍 / 大饵 / 强控鱼';
  if (/light|medium light/.test(power)) return '轻量钓组 / 精细控饵';
  if (/regular|moderate|mod-fast|med-fast/.test(taper)) return 'moving bait / 卷阻饵 / 搜索';
  return '';
}

function parseOzToken(value) {
  const text = n(value).replace(/oz\.?/i, '').trim();
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

function maxOzValue(value) {
  const matches = n(value).match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g) || [];
  return Math.max(0, ...matches.map(parseOzToken));
}

function makeTwEvidence(source, spec, hit, raw) {
  const { row, master } = hit;
  const playerPositioning = inferPlayerPositioning(spec);
  const features = source.features || [];
  const guideHint = guideHintFromFeatures(features, source.leadText || '');
  const supported = ['player_positioning', 'player_selling_points'];
  if (spec.guides || guideHint) supported.push('guide_layout_type', 'guide_use_hint');
  if (spec.handle_length || spec.handle_type) supported.push('Handle Length', 'Grip Type');

  return {
    scope: 'rod_detail',
    id: n(row.id),
    rod_id: n(row.rod_id),
    model: n(master?.model),
    sku: n(row.SKU),
    confidence: source.confidence,
    evidence_type: 'whitelist_retail_specs',
    source_site: 'tacklewarehouse.com',
    source_url: source.url,
    source_model: n(spec.model),
    source_note: source.note || 'Exact normalized model-code match within the configured Megabass series. Used as player/retail context only.',
    source_specs: {
      length: n(spec.length),
      power: n(spec.power),
      taper: n(spec.taper),
      line_wt: n(spec.line_wt),
      lure_wt: n(spec.lure_wt),
      guides: n(spec.guides),
      handle_length: n(spec.handle_length),
      handle_type: n(spec.handle_type),
    },
    official_url: raw?.url || '',
    supported_fields: [...new Set(supported)],
    suggested_player_positioning: playerPositioning,
    suggested_guide_use_hint: guideHint,
    do_not_apply_reason: 'Sidecar evidence only. Third-party retail/player context must be manually reviewed before writing import fields.',
  };
}

function collectTwEvidence(index, rawBySeriesSku) {
  const evidence = [];
  const sourceSummaries = [];

  for (const source of TW_SOURCES) {
    let html = '';
    try {
      html = fetchUrl(source.url);
    } catch (error) {
      sourceSummaries.push({ source_site: 'tacklewarehouse.com', source_url: source.url, status: 'fetch_failed', error: String(error.message || error) });
      continue;
    }

    const text = htmlToText(html);
    const specs = parseTwSpecs(text);
    const sourceWithText = {
      ...source,
      leadText: extractLeadText(text),
      features: extractFeatures(text),
    };
    let matched = 0;

    for (const spec of specs) {
      const key = `${source.series}\u0000${normSku(spec.model)}`;
      const hits = index.bySeriesSku.get(key) || [];
      for (const hit of hits) {
        const raw = rawBySeriesSku.get(key);
        evidence.push(makeTwEvidence(sourceWithText, spec, hit, raw));
        matched += 1;
      }
    }

    sourceSummaries.push({
      source_site: 'tacklewarehouse.com',
      source_url: source.url,
      series: source.series,
      status: 'ok',
      parsed_specs: specs.length,
      matched_details: matched,
    });
  }

  return { evidence, sourceSummaries };
}

function parseHutProduct(html) {
  const metaMatch = html.match(/var meta = (\{[\s\S]*?\});\s*for \(var attr in meta\)/);
  const descMatch = html.match(/"description":"([\s\S]*?)","published_at"/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      return {
        title: meta?.product?.title || '',
        description: descMatch ? descMatch[1] : '',
        variants: meta?.product?.variants || [],
      };
    } catch (_) {
      // Fall through to the embedded checkout product JSON.
    }
  }

  const productMatch = html.match(/"ipBlockerCheckoutProduct"\s*:\s*(\{[\s\S]*?\})\s*,\s*"https:\/\/thehookuptackle\.com\/cdn"/);
  if (!productMatch) return null;
  try {
    const text = productMatch[1]
      .replace(/\\\//g, '/')
      .replace(/\\"/g, '"')
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&');
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function collectHutEvidence(index) {
  const evidence = [];
  const sourceSummaries = [];

  for (const source of HUT_SOURCES) {
    let html = '';
    try {
      html = fetchUrl(source.url);
    } catch (error) {
      sourceSummaries.push({ source_site: 'thehookuptackle.com', source_url: source.url, status: 'fetch_failed', error: String(error.message || error) });
      continue;
    }

    const product = parseHutProduct(html);
    const text = htmlToText(product?.description || html);
    const guideHint = guideHintFromFeatures([], text);
    let matched = 0;

    for (const variant of product?.variants || []) {
      const title = n(variant.title || variant.public_title || variant.option1);
      const modelMatch = title.match(/\b([A-Z]*F\d+(?:\.\d+)?-\d+[A-Z]+|[A-Z]+\d+[A-Z]*)\b/i);
      if (!modelMatch) continue;
      const key = `${source.series}\u0000${normSku(modelMatch[1])}`;
      const hits = index.bySeriesSku.get(key) || [];
      for (const { row, master } of hits) {
        evidence.push({
          scope: 'rod_detail',
          id: n(row.id),
          rod_id: n(row.rod_id),
          model: n(master?.model),
          sku: n(row.SKU),
          confidence: source.confidence,
          evidence_type: 'whitelist_shopify_variant_context',
          source_site: 'thehookuptackle.com',
          source_url: source.url,
          source_model: modelMatch[1],
          source_note: 'Shopify variant title matched the model code; description is older retail context and should stay sidecar until manual review.',
          source_specs: {
            variant_title: title,
            retail_sku: n(variant.sku),
            barcode: n(variant.barcode),
          },
          supported_fields: ['player_positioning', 'player_selling_points', 'guide_use_hint', 'hook_keeper_included'],
          suggested_guide_use_hint: guideHint,
          do_not_apply_reason: 'Sidecar evidence only. Hook keeper and guide material need manual review before field application.',
        });
        matched += 1;
      }
    }

    sourceSummaries.push({
      source_site: 'thehookuptackle.com',
      source_url: source.url,
      series: source.series,
      status: product ? 'ok' : 'parse_limited',
      parsed_variants: product?.variants?.length || 0,
      matched_details: matched,
    });
  }

  return { evidence, sourceSummaries };
}

function collectPlatEvidence(index) {
  const evidence = [];
  const sourceSummaries = [];

  for (const source of PLAT_SOURCES) {
    let html = '';
    try {
      html = fetchUrl(source.url);
    } catch (error) {
      sourceSummaries.push({ source_site: 'plat.co.jp', source_url: source.url, status: 'fetch_failed', error: String(error.message || error) });
      continue;
    }

    const text = htmlToText(html);
    const key = `${source.series}\u0000${normSku(source.model)}`;
    const hits = index.bySeriesSku.get(key) || [];
    const productCode = (text.match(/Product code\s+([0-9]+)/i) || [])[1] || '';

    for (const { row, master } of hits) {
      evidence.push({
        scope: 'rod_detail',
        id: n(row.id),
        rod_id: n(row.rod_id),
        model: n(master?.model),
        sku: n(row.SKU),
        confidence: source.confidence,
        evidence_type: 'whitelist_retail_product_page',
        source_site: 'plat.co.jp',
        source_url: source.url,
        source_model: source.model,
        source_note: 'PLAT page matched exact model page and exposes retailer product-code context. It does not resolve Megabass POWER style, so POWER remains blank by project decision.',
        source_specs: {
          product_code: productCode,
        },
        supported_fields: ['AdminCode'],
        do_not_apply_reason: 'Retail product code is not official JAN/AdminCode coverage for the whole series; keep for manual review only.',
      });
    }

    sourceSummaries.push({
      source_site: 'plat.co.jp',
      source_url: source.url,
      series: source.series,
      status: 'ok',
      matched_details: hits.length,
    });
  }

  return { evidence, sourceSummaries };
}

function uniqueEvidence(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = [item.scope, item.id, item.source_site, item.source_url, item.source_model].join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function main() {
  const index = loadWorkbookRows();
  const rawBySeriesSku = rawIndex();
  const tw = collectTwEvidence(index, rawBySeriesSku);
  const hut = collectHutEvidence(index);
  const plat = collectPlatEvidence(index);
  const evidence = uniqueEvidence([...tw.evidence, ...hut.evidence, ...plat.evidence])
    .sort((a, b) => n(a.model).localeCompare(n(b.model)) || n(a.sku).localeCompare(n(b.sku)) || n(a.source_site).localeCompare(n(b.source_site)));

  const output = {
    generated_at: new Date().toISOString(),
    import_file: path.relative(ROOT, IMPORT_FILE),
    policy: {
      source_boundary: 'Megabass official data remains the authoritative source. Whitelist retail/player pages are sidecar evidence only.',
      match_rule: 'Same configured series plus exact normalized model-code match; no fuzzy URL or title matching.',
      write_rule: 'This script does not modify megabass_rod_import.xlsx.',
    },
    source_summaries: [...tw.sourceSummaries, ...hut.sourceSummaries, ...plat.sourceSummaries],
    evidence,
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`);

  const sourcesOk = output.source_summaries.filter((item) => item.status === 'ok').length;
  const bySite = evidence.reduce((acc, item) => {
    acc[item.source_site] = (acc[item.source_site] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    out_file: path.relative(ROOT, OUT_FILE),
    sources_ok: sourcesOk,
    source_count: output.source_summaries.length,
    evidence_count: evidence.length,
    by_site: bySite,
  }, null, 2));
}

main();
