const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = path.join(__dirname, '../GearSage-client/pkgGear/data_raw');
const NORMALIZED_PATH = path.join(OUTPUT_DIR, 'gamakatsu_hook_normalized.json');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'gamakatsu_hook_import.xlsx');

const BRAND_ID = 19;
const BRAND_NAME = 'Gamakatsu';

const MASTER_HEADERS = [
  'id',
  'brand_id',
  'model',
  'model_cn',
  'model_year',
  'alias',
  'type_tips',
  'images',
  'created_at',
  'updated_at',
  'description',
];

const DETAIL_HEADERS = [
  'id',
  'hookId',
  'brand',
  'sku',
  'type',
  'subType',
  'gapWidth',
  'coating',
  'size',
  'quantityPerPack',
  'price',
  'status',
  'description',
];

const scrapedProducts = [
  {
    model: 'Antenna Hook',
    source_url: 'https://gamakatsu.com/product/antenna-hook/',
    description: `Engineered for precision and finesse, the Antenna Hook is built with Tournament Grade Wire, Nano Smooth Coat, and a stinger hook design. Its 90-degree fluorocarbon weed guard, adjustable closer to the hook point, offers versatile protection and promotes "Shokkaku" - the Japanese concept of heightened perception or sense of touch. The fluorocarbon loop keeper provides excellent plastic retention, making this hook perfect for Gika Rigging and bottom search baits.`,
    type: '特种钩',
    sub_type: 'Antenna / Gika',
    gap_width: '标准',
    coating: 'Nano Smooth Coat',
    status: 'in_stock',
    sizes: ['4', '2', '1'],
    quantity_options: ['4'],
  },
  {
    model: 'Super Tuned Drop Shot',
    source_url: 'https://gamakatsu.com/product/super-tuned-drop-shot/',
    description: `The Super Tuned Drop Shot hook is designed for exceptional performance with a focus on precision and hookup ratios. Featuring Tournament Grade Wire and Nano Alpha finish, this hook boasts a G Lock point with a slightly upturned design to maximize hookup percentages. Its straight shank design ensures the hook rigs straight and stands out more prominently on the fishing line, enhancing presentation.`,
    type: '倒钓钩',
    sub_type: 'Drop Shot',
    gap_width: '标准',
    coating: 'Nano Alpha',
    status: 'in_stock',
    sizes: ['2', '1', '1/0', '2/0'],
    quantity_options: ['6'],
  },
  {
    model: 'Catfish Circle Weedless',
    source_url: 'https://gamakatsu.com/product/catfish-circle-weedless/',
    description: `Bill Dance collaborated with Gamakatsu to create a weedless catfish hook that can navigate dense wood cover without snagging. It is based on Gamakatsu's 221 Series Octopus Circle hook and uses a custom weedguard tuned to keep the hook fishable in heavy cover while still hooking catfish cleanly.`,
    type: '圆钩',
    sub_type: 'Weedless Circle',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['6/0', '7/0', '8/0'],
    quantity_options: ['4'],
  },
  {
    model: 'Stiletto',
    source_url: 'https://gamakatsu.com/product/stiletto/',
    description: `Designed with Mr. Crappie Wally Marshall, the Stiletto uses a large gap and a special acute bend to improve holding power when fishing live or dead bait. The hook is made from light, strong wire and positioned as a premium crappie hook.`,
    type: '特种钩',
    sub_type: 'Stiletto',
    gap_width: '宽腹',
    coating: 'NS Black / Red / Gold',
    status: 'in_stock',
    sizes: ['6', '4', '2', '1', '1/0'],
    quantity_options: ['8', '6', '25'],
  },
  {
    model: 'Sticker',
    source_url: 'https://gamakatsu.com/product/sticker/',
    description: `Designed with Mr. Crappie Wally Marshall, the Sticker is a traditional Aberdeen-style hook built from premium high carbon steel with a very sharp conical point. It is intended as a light wire bait hook with strong penetration for crappie and panfish use.`,
    type: '直柄钩',
    sub_type: 'Aberdeen',
    gap_width: '窄门',
    coating: 'NS Black / Red / Gold',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0'],
    quantity_options: ['8', '6', '25'],
  },
  {
    model: 'Trout Stinger',
    source_url: 'https://gamakatsu.com/product/trout-stinger/',
    description: `The Trout Stinger is a straight-eye, wide-gap hook aimed at freshwater trout, panfish, crappie, and light in-shore species. The no-shine black finish keeps the bait presentation subtle while the thin shank improves penetration.`,
    type: '直柄钩',
    sub_type: 'Trout Stinger',
    gap_width: '宽腹',
    coating: 'NS Black',
    status: 'out_of_stock',
    sizes: ['14', '12', '10', '8'],
    quantity_options: [],
  },
  {
    model: 'Spin Bait',
    source_url: 'https://gamakatsu.com/product/spin-bait/',
    description: `The Spin Bait hook is built for Midwest-style walleye rigs and can run behind spinner blades or prop blades. Its swivel is independent from the hook to reduce line twist, and the bait keeper barbs on the shank improve live and soft bait retention.`,
    type: '挂钩',
    sub_type: 'Spin Bait',
    gap_width: '标准',
    coating: 'Nano Coat',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0'],
    quantity_options: ['4'],
  },
  {
    model: 'Aberdeen',
    source_url: 'https://gamakatsu.com/product/aberdeen-hooks/',
    description: `Gamakatsu's Aberdeen hook uses a long shank and light wire profile for a broad range of freshwater species. It is positioned as a classic bait hook with very sharp penetration and strong hook wire for its class.`,
    type: '直柄钩',
    sub_type: 'Aberdeen',
    gap_width: '窄门',
    coating: 'Bronze',
    status: 'in_stock',
    sizes: ['8', '6', '4', '2', '1'],
    quantity_options: ['10', '8', '6'],
  },
  {
    model: 'Wicked Wacky',
    source_url: 'https://gamakatsu.com/product/wicked-wacky/',
    description: `Built on the proven Shiner hook, the Wicked Wacky adds a hand-tied weed guard for fishing wacky rigs in heavy cover. Gamakatsu also designed a hollow tube on the shank so the hook can be used in power drop shot style presentations.`,
    type: '倒钓钩',
    sub_type: 'Wacky Weedless',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['1/0', '2/0', '3/0', '4/0', '5/0'],
    quantity_options: ['3'],
  },
  {
    model: 'Walleye Wide Gap',
    source_url: 'https://gamakatsu.com/product/walleye-wide-gap/',
    description: `Designed expressly for walleye, this in-line needle point hook is meant to troll cleanly without rolling or twisting. Its light weight supports more natural live bait presentations while preserving Gamakatsu's sharpness and forged strength.`,
    type: '曲柄钩',
    sub_type: 'Wide Gap',
    gap_width: '宽腹',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['8', '6', '4', '2', '1', '1/0', '2/0'],
    quantity_options: ['10', '25', '6', '8'],
  },
  {
    model: 'TW Hook',
    source_url: 'https://gamakatsu.com/product/tw-hooks/',
    description: `TW stands for Trout Worm and targets finesse soft plastic worm presentations that need a fine wire hook. The shape and gap are meant to hold small worms correctly while still keeping fish pinned.`,
    type: '直柄钩',
    sub_type: 'Trout Worm',
    gap_width: '标准',
    coating: 'Bronze',
    status: 'in_stock',
    sizes: ['16', '14', '12', '10', '8', '6'],
    quantity_options: ['10'],
  },
  {
    model: 'Trailer Hook SP',
    source_url: 'https://gamakatsu.com/product/trailer-hook-sp/',
    description: `Trailer Hook SP speeds up attaching a trailer hook to spinnerbaits and buzzbaits. A rubberized coating molded over the eye makes attachment quick and secure while preserving free movement behind the main lure.`,
    type: '挂钩',
    sub_type: 'Trailer Hook',
    gap_width: '标准',
    coating: 'NS Black / Red',
    status: 'in_stock',
    sizes: ['1', '1/0', '2/0', '3/0'],
    quantity_options: ['4', '5'],
  },
  {
    model: 'Split Shot/Drop Shot Weedless',
    source_url: 'https://gamakatsu.com/product/split-shotdrop-shot-weedless/',
    description: `The Weedless Split Shot/Drop Shot hook pairs a wide gap profile with a hand-tied weed guard. It is aimed at exposed-hook finesse presentations that still need to survive brush, wood, and other cover.`,
    type: '倒钓钩',
    sub_type: 'Drop Shot Weedless',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0', '2/0', '3/0'],
    quantity_options: ['4', '5'],
  },
  {
    model: 'Split Shot/Drop Shot',
    source_url: 'https://gamakatsu.com/product/split-shotdrop-shot-hooks/',
    description: `Gamakatsu's Split Shot/Drop Shot hook is a classic finesse profile with a bend tuned for penetration and fish retention. It is positioned for bass nose-hooking as well as trout, walleye, and kokanee finesse applications.`,
    type: '倒钓钩',
    sub_type: 'Drop Shot',
    gap_width: '标准',
    coating: 'Chartreuse / Fluorescent Orange / Fluorescent Pink / Fluorescent Red / NS Black / Red',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0', '2/0', '3/0'],
    quantity_options: ['25', '6'],
  },
  {
    model: 'Spinner Bait',
    source_url: 'https://gamakatsu.com/product/spinner-bait-hooks/',
    description: `Spinner Bait hooks can be used as trailer hooks or directly on some spinnerbait styles. The profile stays simple, but the packaging suggests bulk quantities for heavier-use tackle building or replacement needs.`,
    type: '挂钩',
    sub_type: 'Spinnerbait Trailer',
    gap_width: '标准',
    coating: 'Nickle',
    status: 'in_stock',
    sizes: ['1/0', '2/0', '3/0', '4/0', '5/0'],
    quantity_options: ['100', '25'],
  },
  {
    model: 'Single Egg Hook, Barb on Shank',
    source_url: 'https://gamakatsu.com/product/single-egg-hooks-barb-on-shank/',
    description: `This is a bait hook tuned for single salmon eggs and floating trout bait. The page exposes two type variants, LS and SNL, but does not provide a clean official mapping to a separate size-pack matrix in the public text view.`,
    type: '直柄钩',
    sub_type: 'Egg Hook / Barb on Shank',
    gap_width: '窄门',
    coating: 'Gold / Red',
    status: 'in_stock',
    sizes: ['14', '12', '10', '8', '6'],
    quantity_options: ['10'],
  },
  {
    model: 'Shiner Upturned Eye',
    source_url: 'https://gamakatsu.com/product/shiner-hooks-upturned-eye/',
    description: `The Upturned Eye Shiner hook keeps the familiar Shiner shape but changes the eye orientation to make snelled rigs easier to build. It is aimed at live shiners, crawdads, shrimp, and similar bait presentations.`,
    type: '直柄钩',
    sub_type: 'Upturned Eye',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['6', '4', '2', '1', '1/0', '2/0', '3/0', '4/0', '5/0', '6/0'],
    quantity_options: ['25', '3', '4', '5', '6', '7', '8'],
  },
  {
    model: 'Shiner Straight Eye',
    source_url: 'https://gamakatsu.com/product/shiner-hooks-straight-eye/',
    description: `The Straight Eye Shiner hook is built for live shiners, crawdads, shrimp, and many catfish bait applications. Its light weight is intended to improve natural bait presentation while keeping forged strength.`,
    type: '直柄钩',
    sub_type: 'Straight Eye',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['6', '4', '2', '1', '1/0', '2/0', '3/0', '4/0', '5/0', '6/0'],
    quantity_options: ['25', '3', '4', '5', '6', '7', '8'],
  },
  {
    model: 'Micro Wide Gap',
    source_url: 'https://gamakatsu.com/product/micro-wide-gap/',
    description: `The Micro Wide Gap uses a fine wire profile to reduce required hook-setting pressure and tissue damage in catch-and-release fisheries. It is explicitly positioned as a wide gap hook for small bait or ice fishing use.`,
    type: '曲柄钩',
    sub_type: 'Micro Wide Gap',
    gap_width: '宽腹',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['10', '8', '6'],
    quantity_options: ['10'],
  },
  {
    model: 'Micro V Gap',
    source_url: 'https://gamakatsu.com/product/micro-v-gap/',
    description: `The Micro V Gap uses fine wire and an up-eye design, but adds a deep V bend to improve retention. It sits in the same small-bait and ice-fishing family as the other Micro profiles.`,
    type: '曲柄钩',
    sub_type: 'Micro V Gap',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['12', '10', '8', '6'],
    quantity_options: ['10'],
  },
  {
    model: 'Micro Perfect Gap',
    source_url: 'https://gamakatsu.com/product/micro-perfect-gap/',
    description: `The Micro Perfect Gap uses fine wire for low-pressure penetration and adds an up-eye design sized for minnows or small plastics. It is another compact freshwater and ice-fishing profile.`,
    type: '曲柄钩',
    sub_type: 'Micro Perfect Gap',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['12', '10', '8', '6', '4'],
    quantity_options: ['10'],
  },
  {
    model: 'G-Stinger',
    source_url: 'https://gamakatsu.com/product/g-stinger/',
    description: `G-Stinger is positioned as a utility stinger hook that can be attached to hooks or lures such as spinnerbaits, buzzbaits, jerkbaits, and jigging spoons. The page indicates sizes 1 and 1/0 use a 50 lb loop.`,
    type: '挂钩',
    sub_type: 'Stinger',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['2', '1', '1/0'],
    quantity_options: ['4'],
  },
  {
    model: 'G-Carp Super Hook',
    source_url: 'https://gamakatsu.com/product/g-carp-super-hook/',
    description: `The G-Carp Super Hook is meant for pop-up carp assemblies and is shaped to rotate and engage securely in the lower lip of the fish. It uses Nano Smooth coating to improve penetration while staying concealed in bait.`,
    type: '鲤鱼钩',
    sub_type: 'Super Hook',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['10', '8', '6', '4', '2', '1'],
    quantity_options: ['10'],
  },
  {
    model: 'G-Carp Specialist RX',
    source_url: 'https://gamakatsu.com/product/g-carp-specialist-rx/',
    description: `The G-Carp Specialist RX is part of Gamakatsu's concealed-bait carp family. The page text is sparse, but it keeps the same concealment-oriented carp hook positioning and NS Black finish as the rest of the G-Carp range.`,
    type: '鲤鱼钩',
    sub_type: 'Specialist RX',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['12', '10', '8', '6', '4', '2'],
    quantity_options: ['10'],
  },
  {
    model: 'G-Carp Specialist R',
    source_url: 'https://gamakatsu.com/product/g-carp-specialist-r/',
    description: `The G-Carp Specialist R uses a claw-style hook point that turns inward by about 15 degrees to improve hook sets. The page positions it as a tough carp hook with strong retention under load.`,
    type: '鲤鱼钩',
    sub_type: 'Specialist R',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['12', '10', '8', '6', '4', '2'],
    quantity_options: ['10'],
  },
  {
    model: 'G-Carp Hump Back',
    source_url: 'https://gamakatsu.com/product/g-carp-hump-back/',
    description: `The G-Carp Hump Back is designed to turn automatically toward the lower lip and penetrate quickly. Its forged curved shank adds strength and resilience, and the page emphasizes fast hooking with a micro-barb and Nano Smooth coating.`,
    type: '鲤鱼钩',
    sub_type: 'Hump Back',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['10', '8', '6', '4', '2'],
    quantity_options: ['10'],
  },
  {
    model: 'Finesse Wide Gap Weedless',
    source_url: 'https://gamakatsu.com/product/finesse-wide-gap-weedless/',
    description: `The Weedless Finesse Wide Gap adds a nylon weed guard so wacky rigs can be pitched into heavier cover. It keeps the familiar finesse wide gap hook family but pushes it toward cover-oriented presentations.`,
    type: '曲柄钩',
    sub_type: 'Finesse Wide Gap Weedless',
    gap_width: '宽腹',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0', '2/0', '3/0', '4/0', '5/0', '6/0'],
    quantity_options: ['4', '5'],
  },
  {
    model: 'Finesse Wide Gap',
    source_url: 'https://gamakatsu.com/product/finesse-wide-gap/',
    description: `The Finesse Wide Gap is aimed at bass wacky rigging and also works for free drifting salmon and steelhead with small baits. The profile is a classic finesse wide-gap shape available in black and red finishes.`,
    type: '曲柄钩',
    sub_type: 'Finesse Wide Gap',
    gap_width: '宽腹',
    coating: 'NS Black / Red',
    status: 'in_stock',
    sizes: ['4', '2', '1', '1/0', '2/0', '3/0', '4/0', '5/0', '6/0'],
    quantity_options: ['25', '5', '6'],
  },
  {
    model: 'Crappie Assortment',
    source_url: 'https://gamakatsu.com/product/crappie-hooks-assortment/',
    description: `This is a crappie and panfish assortment pack that mixes multiple colors into one product. It is positioned as a convenience assortment rather than a single profile hook.`,
    type: '组合钩',
    sub_type: 'Assortment',
    gap_width: '混合',
    coating: 'NS Black / Bronze / Red / Green / Blue',
    status: 'in_stock',
    sizes: ['8', '6', '4', '2'],
    quantity_options: ['15'],
  },
  {
    model: 'Catfish Assortment',
    source_url: 'https://gamakatsu.com/product/catfish-hook-assortment/',
    description: `This is a catfish assortment product with public text that exposes a single pack quantity and a mixed size range. The page behaves more like a bundled assortment than a single consistent hook profile.`,
    type: '组合钩',
    sub_type: 'Assortment',
    gap_width: '混合',
    coating: '',
    status: 'in_stock',
    sizes: ['1/0', '4/0', '6/0', '8/0'],
    quantity_options: ['20'],
  },
  {
    model: 'Big Cat Circle',
    source_url: 'https://gamakatsu.com/product/big-cat-circle/',
    description: `The Big Cat Circle hook is built for tough-lipped catfish with an offset, precision-sharpened point and an up eye for quick snelling. The page positions it as a heavy-duty forged circle hook for very large catfish.`,
    type: '圆钩',
    sub_type: 'Big Cat Circle',
    gap_width: '标准',
    coating: 'NS Black',
    status: 'in_stock',
    sizes: ['1/0', '2/0', '3/0', '4/0', '5/0', '6/0', '7/0', '8/0', '10/0', '12/0'],
    quantity_options: ['25', '3', '5', '6'],
  },
];

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).map((item) => normalizeText(item)).filter(Boolean)));
}

function buildTypeTips(item) {
  const parts = [item.type, item.sub_type].filter(Boolean);
  return parts.join(' / ');
}

function buildVariantLabel(item, size, quantityPerPack) {
  const parts = [item.model];

  if (size) {
    parts.push(size);
  }

  if (quantityPerPack) {
    parts.push(`${quantityPerPack} pack`);
  }

  return parts.join(' | ');
}

function buildVariantSpecs(item) {
  const sizes = uniqueStrings(item.sizes);
  const quantityOptions = uniqueStrings(item.quantity_options);

  const rows = [];

  if (sizes.length === 0 && quantityOptions.length === 0) {
    rows.push({
      sku: item.model,
      size: '',
      quantityPerPack: '',
    });
    return rows;
  }

  if (sizes.length > 0 && quantityOptions.length === 0) {
    for (const size of sizes) {
      rows.push({
        sku: buildVariantLabel(item, size, ''),
        size,
        quantityPerPack: '',
      });
    }
    return rows;
  }

  if (sizes.length === 0 && quantityOptions.length > 0) {
    for (const quantityPerPack of quantityOptions) {
      rows.push({
        sku: buildVariantLabel(item, '', quantityPerPack),
        size: '',
        quantityPerPack,
      });
    }
    return rows;
  }

  for (const size of sizes) {
    for (const quantityPerPack of quantityOptions) {
      rows.push({
        sku: buildVariantLabel(item, size, quantityPerPack),
        size,
        quantityPerPack,
      });
    }
  }

  return rows;
}

function buildNormalizedData() {
  return scrapedProducts.map((item) => {
    const normalized = {
      brand: BRAND_NAME,
      kind: 'hook',
      model: normalizeText(item.model),
      model_year: '',
      alias: '',
      type_tips: buildTypeTips(item),
      images: '',
      source_url: normalizeText(item.source_url),
      description: normalizeText(item.description),
      type: normalizeText(item.type),
      sub_type: normalizeText(item.sub_type),
      gap_width: normalizeText(item.gap_width),
      coating: normalizeText(item.coating),
      status: normalizeText(item.status),
      sizes: uniqueStrings(item.sizes),
      quantity_options: uniqueStrings(item.quantity_options),
    };

    normalized.variants = buildVariantSpecs(item).map((variant) => ({
      sku: variant.sku,
      type: normalized.type,
      subType: normalized.sub_type,
      gapWidth: normalized.gap_width,
      coating: normalized.coating,
      size: variant.size,
      quantityPerPack: variant.quantityPerPack,
      price: '',
      status: normalized.status,
      description: '',
    }));

    return normalized;
  });
}

function buildWorkbook(normalizedData) {
  const wb = XLSX.utils.book_new();
  const masterRows = [];
  const detailRows = [];

  let masterCounter = 1000;
  let detailCounter = 10000;

  for (const item of normalizedData) {
    const masterId = `GHK${masterCounter++}`;

    masterRows.push({
      id: masterId,
      brand_id: BRAND_ID,
      model: item.model,
      model_cn: '',
      model_year: '',
      alias: '',
      type_tips: item.type_tips,
      images: item.images,
      created_at: '',
      updated_at: '',
      description: item.description,
    });

    for (const variant of item.variants) {
      detailRows.push({
        id: `GHKD${detailCounter++}`,
        hookId: masterId,
        brand: BRAND_NAME,
        sku: variant.sku,
        type: variant.type,
        subType: variant.subType,
        gapWidth: variant.gapWidth,
        coating: variant.coating,
        size: variant.size,
        quantityPerPack: variant.quantityPerPack,
        price: variant.price,
        status: variant.status,
        description: variant.description,
      });
    }
  }

  const masterSheet = XLSX.utils.json_to_sheet(masterRows, { header: MASTER_HEADERS });
  XLSX.utils.book_append_sheet(wb, masterSheet, 'hook');

  const detailSheet = XLSX.utils.json_to_sheet(detailRows, { header: DETAIL_HEADERS });
  XLSX.utils.book_append_sheet(wb, detailSheet, 'hook_detail');

  return { wb, masterRows, detailRows };
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const normalizedData = buildNormalizedData();
  fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(normalizedData, null, 2), 'utf8');

  const { wb, masterRows, detailRows } = buildWorkbook(normalizedData);
  XLSX.writeFile(wb, EXCEL_PATH);

  console.log(`[hook] wrote normalized data: ${NORMALIZED_PATH}`);
  console.log(`[hook] wrote excel: ${EXCEL_PATH}`);
  console.log(`[hook] master rows=${masterRows.length} detail rows=${detailRows.length}`);
}

main();
