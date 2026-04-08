import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import * as XLSX from 'xlsx';
import { DatabaseService } from '../../common/database.service';

type GearType = 'reels' | 'rods' | 'lures' | 'lines';
type GearKind = 'reel' | 'rod' | 'lure' | 'line';

interface GearListQuery {
  type?: string;
  page?: string | number;
  pageSize?: string | number;
  keyword?: string;
  brands?: string | string[];
  types?: string | string[];
  system?: string | string[];
  water_column?: string | string[];
  action?: string | string[];
  options?: string | string[];
  brakeSys?: string | string[];
}

interface GearDetailQuery {
  id?: string | number;
  type?: string;
  gearModel?: string;
}

interface GearCache {
  brands: any[];
  brandsMap: Record<string, any>;
  reels: any[];
  rods: any[];
  lures: any[];
  lines: any[];
  reelDetails: Record<string, any[]>;
  rodDetails: any[];
  lureDetails: Record<string, any[]>;
  lineDetails: any[];
  fieldSupport: Record<GearType, Record<string, boolean>>;
}

@Injectable()
export class GearService {
  private excelCache: GearCache | null = null;
  private readonly fieldLabels: Record<string, string> = {
    SKU: '子型号',
    sku: '子型号',
    'GEAR RATIO': '速比',
    DRAG: '实用卸力(kg)',
    'MAX DRAG': '最大卸力(kg)',
    WEIGHT: '自重(g)',
    fluorocarbon_no_m: '氟碳线(号-m)',
    fluorocarbon_lb_m: '氟碳线(lb-m)',
    pe_no_m: 'PE线(号-m)',
    cm_per_turn: '收线长(cm/圈)',
    spool_diameter_per_turn_mm: '线杯径/一转(mm)',
    Nylon_no_m: '尼龙线(号-m)',
    Nylon_lb_m: '尼龙线(lb-m)',
    handle_length_mm: '手把长(mm)',
    'TOTAL LENGTH': '全长(m)',
    Action: '调性',
    PIECES: '节数',
    CLOSELENGTH: '收纳长(cm)',
    'Tip Diameter': '先径(mm)',
    'LURE WEIGHT': '饵重(g)',
    'Line Wt N F': '尼/氟线(lb)',
    'PE Line Size': 'PE线(号)',
    'Handle Length': '手把长(mm)',
    'CONTENT CARBON': '含碳量(%)',
    'Service Card': '首保价(元)',
    'Jig Weight': '铁板重(g)',
    'Squid Jig Size': '木虾(号)',
    'Sinker Rating': '铅坠(号)',
    TYPE: '类别',
    type: '类别',
    system: '体系',
    action: '动作',
    water_column: '水层',
    'Reel Seat Position': '轮座位置',
    Length: '长度(mm)',
    Weight: '重量(g)',
    Buoyancy: '浮力',
    Range: '泳层',
    Hook: '钩型',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getBrands(type?: string) {
    const normalizedType = this.normalizeType(type);
    const data = await this.getData(normalizedType);
    const rows = this.getMasterRows(data, normalizedType);
    const brandIds = new Set(
      rows.map((item) => this.normalizeText(item.brand_id)).filter(Boolean),
    );

    return data.brands
      .filter((brand) => brandIds.has(this.normalizeText(brand.id)))
      .map((brand) => ({
        id: String(brand.id),
        name: brand.name || '',
      }));
  }

  async getList(query: GearListQuery) {
    const normalizedType = this.normalizeType(query.type);
    const page = this.normalizePositiveNumber(query.page, 1);
    const pageSize = this.normalizePositiveNumber(query.pageSize, 10);
    const data = await this.getData(normalizedType);
    const rows = this.getMasterRows(data, normalizedType);
    const filtered = rows.filter((item) =>
      this.matchesListFilters(
        item,
        normalizedType,
        query,
        data.fieldSupport[normalizedType],
      ),
    );
    const total = filtered.length;
    const list = filtered
      .slice((page - 1) * pageSize, page * pageSize)
      .map((item) => this.formatMasterItem(item, data.brandsMap, normalizedType));

    return {
      list,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    };
  }

  async getDetail(query: GearDetailQuery) {
    const normalizedType = this.normalizeType(query.type);
    const data = await this.getData(normalizedType);
    const item = this.findMasterItem(
      this.getMasterRows(data, normalizedType),
      query.id,
      query.gearModel,
    );

    if (!item) {
      return null;
    }

    const master = this.formatMasterItem(item, data.brandsMap, normalizedType);
    const brand = data.brandsMap[this.normalizeText(item.brand_id)] || null;
    const variants = this.getVariantsForItem(normalizedType, item, data);

    return {
      ...master,
      brand_name: brand?.name || '',
      brand: brand
        ? {
            id: String(brand.id),
            name: brand.name || '',
          }
        : null,
      variants,
      official_specs: this.buildOfficialSpecs(normalizedType, item, 'master'),
      gsc_traits: this.buildGscTraits(normalizedType, item, null),
      compare_profile: this.buildCompareProfile(normalizedType, item, null, variants),
    };
  }

  private async getData(type: GearType): Promise<GearCache> {
    const dbData = await this.loadDbData(type);
    if (dbData) {
      return dbData;
    }

    return this.ensureExcelCache();
  }

  private async loadDbData(type: GearType): Promise<GearCache | null> {
    try {
      const kind = this.typeToKind(type);
      const masterResult = await this.databaseService.query<{
        id: string;
        brandId: string | null;
        model: string;
        modelCn: string;
        modelYear: string;
        type: string;
        system: string;
        waterColumn: string;
        action: string;
        alias: string;
        typeTips: string;
        images: string[] | string | null;
        raw_json: Record<string, any>;
      }>(
        `
          SELECT
            id,
            "brandId",
            model,
            "modelCn",
            "modelYear",
            type,
            system,
            "waterColumn",
            action,
            alias,
            "typeTips",
            images,
            raw_json
          FROM gear_master
          WHERE kind = $1
          ORDER BY id ASC
        `,
        [kind],
      );

      if (!masterResult.rows.length) {
        return null;
      }

      const masters = masterResult.rows.map((row) => this.hydrateMasterRow(row));
      const brandIds = [
        ...new Set(
          masters.map((item) => this.normalizeText(item.brand_id)).filter(Boolean),
        ),
      ];

      const brandResult =
        brandIds.length > 0
          ? await this.databaseService.query<{
              id: string;
              name: string;
              raw_json: Record<string, any>;
            }>(
              `
                SELECT id, name, raw_json
                FROM gear_brands
                WHERE id = ANY($1::bigint[])
              `,
              [brandIds.map((item) => Number(item))],
            )
          : { rows: [] as any[] };

      const brands = brandResult.rows.map((row) => this.hydrateBrandRow(row));
      const brandsMap = brands.reduce<Record<string, any>>((acc, brand: any) => {
        acc[this.normalizeText(brand.id)] = brand;
        return acc;
      }, {});

      const variantResult = await this.databaseService.query<{
        sourceKey: string;
        gearId: string;
        raw_json: Record<string, any>;
      }>(
        `
          SELECT "sourceKey", "gearId", raw_json
          FROM gear_variants
          WHERE kind = $1
          ORDER BY "gearId" ASC
        `,
        [kind],
      );

      return this.buildCacheFromDb(type, masters, brands, brandsMap, variantResult.rows);
    } catch (error) {
      console.warn('[GearService] Falling back to Excel data source:', error);
      return null;
    }
  }

  private buildCacheFromDb(
    type: GearType,
    masters: any[],
    brands: any[],
    brandsMap: Record<string, any>,
    variants: Array<{ sourceKey: string; gearId: string; raw_json: Record<string, any> }>,
  ): GearCache {
    const reels = type === 'reels' ? masters : [];
    const rods = type === 'rods' ? masters : [];
    const lures = type === 'lures' ? masters : [];
    const lines = type === 'lines' ? masters : [];

    const reelDetails: Record<string, any[]> = {};
    const rodDetails: any[] = [];
    const lureDetails: Record<string, any[]> = {};
    const lineDetails: any[] = [];

    for (const variant of variants) {
      const raw = this.hydrateVariantRow(variant.raw_json);
      if (type === 'reels') {
        const key = this.normalizeText(variant.sourceKey);
        const bucket = reelDetails[key] || [];
        bucket.push(raw);
        reelDetails[key] = bucket;
        continue;
      }

      if (type === 'rods') {
        rodDetails.push(raw);
        continue;
      }

      if (type === 'lines') {
        lineDetails.push(raw);
        continue;
      }

      const key = this.normalizeText(variant.sourceKey);
      const bucket = lureDetails[key] || [];
      bucket.push(raw);
      lureDetails[key] = bucket;
    }

    return {
      brands,
      brandsMap,
      reels,
      rods,
      lures,
      lines,
      reelDetails,
      rodDetails,
      lureDetails,
      lineDetails,
      fieldSupport: {
        reels: this.buildFieldSupport(reels),
        rods: this.buildFieldSupport(rods),
        lures: this.buildFieldSupport(lures),
        lines: this.buildFieldSupport(lines),
      },
    };
  }

  private ensureExcelCache(): GearCache {
    if (this.excelCache) {
      return this.excelCache;
    }

    const brands = this.readExcelRows('brand.xlsx');
    const reels = this.readExcelRows('reel.xlsx');
    const rods = this.readExcelRows('rod.xlsx');
    const lures = this.readExcelRows('lure.xlsx');
    const lines = this.readExcelRows('line.xlsx');

    const brandsMap = brands.reduce<Record<string, any>>((acc, brand: any) => {
      acc[this.normalizeText(brand.id)] = brand;
      return acc;
    }, {});

    const reelDetails: Record<string, any[]> = {
      spinning: this.readExcelRows('spinning_reel_detail.xlsx'),
      baitcasting: this.readExcelRows('baitcasting_reel_detail.xlsx'),
    };

    const lureDetails: Record<string, any[]> = {
      hardbait: this.readExcelRows('hardbait_lure_detail.xlsx'),
      soft: this.readExcelRows('soft_lure_detail.xlsx'),
      jig: this.readExcelRows('jig_lure_detail.xlsx'),
      metal: this.readExcelRows('metal_lure_detail.xlsx'),
      wire: this.readExcelRows('wire_lure_detail.xlsx'),
    };

    this.excelCache = {
      brands,
      brandsMap,
      reels,
      rods,
      lures,
      lines,
      reelDetails,
      rodDetails: this.readExcelRows('rod_detail.xlsx'),
      lureDetails,
      lineDetails: this.readExcelRows('line_detail.xlsx'),
      fieldSupport: {
        reels: this.buildFieldSupport(reels),
        rods: this.buildFieldSupport(rods),
        lures: this.buildFieldSupport(lures),
        lines: this.buildFieldSupport(lines),
      },
    };

    return this.excelCache;
  }

  private buildFieldSupport(rows: any[]) {
    const support: Record<string, boolean> = {};
    rows.forEach((item) => {
      Object.keys(item || {}).forEach((key) => {
        if (this.hasValue(item[key])) {
          support[key] = true;
        }
      });
    });
    return support;
  }

  private getMasterRows(data: GearCache, type: GearType) {
    if (type === 'rods') return data.rods;
    if (type === 'lures') return data.lures;
    if (type === 'lines') return data.lines;
    return data.reels;
  }

  private getVariantsForItem(type: GearType, item: any, data: GearCache) {
    const itemId = this.normalizeText(item.id);

    if (type === 'reels') {
      const detailRows = data.reelDetails[this.normalizeText(item.type)] || [];
      return detailRows
        .filter((variant) => this.normalizeText(variant.reel_id) === itemId)
        .map((variant) => this.decorateVariant(type, item, variant));
    }

    if (type === 'rods') {
      return data.rodDetails
        .filter((variant) => this.normalizeText(variant.rod_id) === itemId)
        .map((variant) => this.decorateVariant(type, item, variant));
    }

    if (type === 'lines') {
      return data.lineDetails
        .filter((variant) => this.normalizeText(variant.line_id) === itemId)
        .map((variant) => this.decorateVariant(type, item, variant));
    }

    const detailRows = data.lureDetails[this.normalizeText(item.system)] || [];
    return detailRows
      .filter((variant) => this.normalizeText(variant.lure_id) === itemId)
      .map((variant) => this.decorateVariant(type, item, variant));
  }

  private decorateVariant(type: GearType, master: any, variant: any) {
    return {
      ...variant,
      official_specs: this.buildOfficialSpecs(type, variant, 'variant'),
      gsc_traits: this.buildGscTraits(type, master, variant),
      compare_profile: this.buildCompareProfile(type, master, variant),
    };
  }

  private findMasterItem(rows: any[], id?: string | number, gearModel?: string) {
    const targetId = this.normalizeText(id);
    if (targetId) {
      const byId = rows.find((item) => this.normalizeText(item.id) === targetId);
      if (byId) {
        return byId;
      }
    }

    const candidates = this.buildGearModelCandidates(gearModel);
    if (!candidates.length) {
      return null;
    }

    const exact = rows.find((item) => {
      const model = this.normalizeText(item.model);
      const modelCn = this.normalizeText(item.model_cn);
      return candidates.includes(model) || candidates.includes(modelCn);
    });
    if (exact) {
      return exact;
    }

    return (
      rows.find((item) => {
        const model = this.normalizeText(item.model).toLowerCase();
        const modelCn = this.normalizeText(item.model_cn).toLowerCase();
        return candidates.some((candidate) => {
          const normalized = candidate.toLowerCase();
          return model.includes(normalized) || modelCn.includes(normalized);
        });
      }) || null
    );
  }

  private formatMasterItem(item: any, brandsMap: Record<string, any>, type: GearType) {
    const brand = brandsMap[this.normalizeText(item.brand_id)] || null;
    const images = this.normalizeImages(item.images);
    return {
      ...item,
      id: this.normalizeText(item.id),
      brand_id: item.brand_id,
      brand_name: brand?.name || '',
      images,
      imageUrl: images[0] || '/images/default-gear.png',
      displayName: this.buildDisplayName(item),
      official_specs: this.buildOfficialSpecs(type, item, 'master'),
      gsc_traits: this.buildGscTraits(type, item, null),
      compare_profile: this.buildCompareProfile(type, item),
    };
  }

  private matchesListFilters(
    item: any,
    type: GearType,
    query: GearListQuery,
    fieldSupport: Record<string, boolean>,
  ) {
    if (!this.matchesKeyword(item, query.keyword)) {
      return false;
    }

    if (!this.matchesField(item.brand_id, query.brands)) {
      return false;
    }

    if (type !== 'lures' && fieldSupport.type && !this.matchesField(item.type, query.types)) {
      return false;
    }

    if (type === 'lures') {
      if (fieldSupport.system && !this.matchesField(item.system, query.system)) {
        return false;
      }
      if (fieldSupport.water_column && !this.matchesField(item.water_column, query.water_column)) {
        return false;
      }
      if (fieldSupport.action && !this.matchesField(item.action, query.action)) {
        return false;
      }
    }

    if (fieldSupport.options && !this.matchesField(item.options, query.options)) {
      return false;
    }

    if (fieldSupport.brakeSys && !this.matchesField(item.brakeSys, query.brakeSys)) {
      return false;
    }

    return true;
  }

  private matchesKeyword(item: any, keyword?: string) {
    const normalizedKeyword = this.normalizeText(keyword).toLowerCase();
    if (!normalizedKeyword) {
      return true;
    }

    const haystacks = [
      this.normalizeText(item.model),
      this.normalizeText(item.model_cn),
      this.normalizeText(item.model_year),
      this.normalizeText(item.alias),
      this.normalizeText(item.type_tips),
    ]
      .join(' ')
      .toLowerCase();

    return normalizedKeyword
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystacks.includes(token));
  }

  private matchesField(value: any, rawFilter?: string | string[]) {
    const candidates = this.normalizeArray(rawFilter);
    if (!candidates.length) {
      return true;
    }

    const normalizedValue = this.normalizeText(value).toLowerCase();
    if (!normalizedValue) {
      return false;
    }

    return candidates.some((item) => item.toLowerCase() === normalizedValue);
  }

  private normalizeArray(value?: string | string[]) {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeText(item)).filter(Boolean);
    }

    const text = this.normalizeText(value);
    if (!text) {
      return [];
    }

    return text
      .split(',')
      .map((item) => this.normalizeText(item))
      .filter(Boolean);
  }

  private normalizePositiveNumber(value: string | number | undefined, fallback: number) {
    const next = Number(value);
    return Number.isInteger(next) && next > 0 ? next : fallback;
  }

  private buildDisplayName(item: any) {
    const year = this.normalizeText(item.model_year);
    const model = this.normalizeText(item.model);
    const modelCn = this.normalizeText(item.model_cn);
    const base = year ? `${year} ${model}` : model;
    return modelCn ? `${base} ${modelCn}`.trim() : base;
  }

  private normalizeImages(images: any) {
    const list = Array.isArray(images)
      ? images
      : this.normalizeText(images)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    const mapped = list.map((item) => this.mapGearImage(item)).filter(Boolean);

    return mapped.length ? mapped : ['/images/default-gear.png'];
  }

  private mapGearImage(input: string) {
    const text = this.normalizeText(input);
    if (!text) {
      return '';
    }

    if (text.startsWith('/')) {
      return text;
    }

    if (text.startsWith('http://') || text.startsWith('https://')) {
      return text;
    }

    const fileName = basename(text);
    const clientAssetPath = join(this.getClientWebpDir(), fileName);
    if (existsSync(clientAssetPath)) {
      return `/rate/webp/${fileName}`;
    }

    return '/images/default-gear.png';
  }

  private buildGearModelCandidates(gearModel?: string) {
    const raw = this.normalizeText(gearModel);
    if (!raw) {
      return [];
    }

    const candidates: string[] = [];
    const push = (value: string) => {
      const text = this.normalizeText(value);
      if (text && !candidates.includes(text)) {
        candidates.push(text);
      }
    };

    push(raw);

    const yearMatch = raw.match(/^(\d{2,4})\s+(.+)$/);
    if (yearMatch) {
      push(yearMatch[2]);
    }

    const chinese = raw.match(/[\u4e00-\u9fa5]+/g);
    if (chinese?.length) {
      push(chinese.join(''));
    }

    const alphaNumeric = raw
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (alphaNumeric) {
      push(alphaNumeric);
    }

    return candidates;
  }

  private hydrateMasterRow(row: {
    id: string;
    brandId: string | null;
    model: string;
    modelCn: string;
    modelYear: string;
    type: string;
    system: string;
    waterColumn: string;
    action: string;
    alias: string;
    typeTips: string;
    images: any;
    raw_json: Record<string, any>;
  }) {
    const raw = { ...(row.raw_json || {}) };
    return {
      ...raw,
      id: this.normalizeText(row.id),
      brand_id: row.brandId ? Number(row.brandId) : raw.brand_id,
      model: row.model || raw.model || '',
      model_cn: row.modelCn || raw.model_cn || '',
      model_year: row.modelYear || raw.model_year || '',
      type: row.type || raw.type || '',
      system: row.system || raw.system || '',
      water_column: row.waterColumn || raw.water_column || '',
      action: row.action || raw.action || '',
      alias: row.alias || raw.alias || '',
      type_tips: row.typeTips || raw.type_tips || '',
      images: Array.isArray(row.images) ? row.images : raw.images || [],
    };
  }

  private hydrateVariantRow(rawJson: Record<string, any>) {
    return { ...(rawJson || {}) };
  }

  private buildOfficialSpecs(
    type: GearType,
    row: Record<string, any>,
    level: 'master' | 'variant',
  ) {
    const reservedKeys = new Set([
      'id',
      '_id',
      '_openid',
      'created_at',
      'updated_at',
      'raw_json',
      'official_specs',
      'gsc_traits',
      'compare_profile',
      'images',
      'brand_id',
      'reel_id',
      'rod_id',
      'lure_id',
      'line_id',
    ]);

    const masterFieldsByType: Record<GearType, string[]> = {
      reels: ['model', 'model_cn', 'model_year', 'type', 'alias', 'type_tips'],
      rods: ['model', 'model_cn', 'model_year', 'type', 'action', 'type_tips'],
      lures: ['model', 'model_cn', 'model_year', 'system', 'water_column', 'action'],
      lines: ['model', 'model_cn', 'model_year', 'type_tips', 'description'],
    };

    const variantFieldsByType: Record<GearType, string[]> = {
      reels: [
        'SKU',
        'GEAR RATIO',
        'WEIGHT',
        'MAX DRAG',
        'DRAG',
        'cm_per_turn',
        'spool_diameter_per_turn_mm',
        'Nylon_lb_m',
        'Nylon_no_m',
        'fluorocarbon_lb_m',
        'fluorocarbon_no_m',
        'pe_no_m',
        'handle_length_mm',
      ],
      rods: [
        'SKU',
        'TOTAL LENGTH',
        'Action',
        'LURE WEIGHT',
        'Line Wt N F',
        'PE Line Size',
        'PIECES',
        'CLOSELENGTH',
        'Tip Diameter',
        'Handle Length',
        'CONTENT CARBON',
        'Reel Seat Position',
      ],
      lures: ['SKU', 'TYPE', 'Length', 'Weight', 'Buoyancy', 'Range', 'Hook'],
      lines: [
        'SKU',
        'COLOR',
        'LENGTH(m)',
        'SIZE NO.',
        'MAX STRENGTH(lb)',
        'MAX STRENGTH(kg)',
        'AVG STRENGTH(lb)',
        'AVG STRENGTH(kg)',
        'Market Reference Price',
        'AdminCode',
      ],
    };

    const preferredFields =
      level === 'master' ? masterFieldsByType[type] || [] : variantFieldsByType[type] || [];

    const result: Record<string, string> = {};
    for (const field of preferredFields) {
      const value = this.normalizeText(row[field]);
      if (value) {
        result[field] = value;
        reservedKeys.add(field);
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }

    Object.keys(row || {}).forEach((key) => {
      if (reservedKeys.has(key)) {
        return;
      }
      const value = this.normalizeText(row[key]);
      if (value) {
        result[key] = value;
      }
    });

    return result;
  }

  private buildGscTraits(type: GearType, master: Record<string, any>, variant: Record<string, any> | null) {
    const directTraits = this.normalizeTraitObject(
      (variant && (variant.gsc_traits || variant.gscTraits)) ||
        master.gsc_traits ||
        master.gscTraits,
    );
    if (Object.keys(directTraits).length > 0) {
      return directTraits;
    }

    const fitStyleTags = this.collectFitStyleTags(type, master, variant);
    const compareWarnings = this.collectCompareWarnings(type, master, variant);
    const traits: Record<string, any> = {};

    if (fitStyleTags.length > 0) {
      traits.fitStyleTags = fitStyleTags;
    }

    const lineCupDepth = this.inferLineCupDepth(variant);
    if (lineCupDepth) {
      traits.lineCupDepth = lineCupDepth;
    }

    const brakeTypeNormalized = this.inferBrakeType(master, variant);
    if (brakeTypeNormalized) {
      traits.brakeTypeNormalized = brakeTypeNormalized;
    }

    const minLureWeightHint = this.inferMinLureWeightHint(type, variant);
    if (minLureWeightHint) {
      traits.minLureWeightHint = minLureWeightHint;
    }

    const solidTip = this.inferSolidTip(master, variant);
    if (solidTip !== null) {
      traits.solidTip = solidTip;
    }

    if (compareWarnings.length > 0) {
      traits.compareWarnings = compareWarnings;
    }

    return traits;
  }

  private buildCompareProfile(
    type: GearType,
    master: Record<string, any>,
    variant?: Record<string, any> | null,
    variants?: any[],
  ) {
    const variantProfile = this.normalizeTraitObject(
      (variant && (variant.compare_profile || variant.compareProfile)) || {},
    );
    if (Object.keys(variantProfile).length > 0) {
      return variantProfile;
    }

    const masterProfile = this.normalizeTraitObject(
      (master.compare_profile || master.compareProfile) || {},
    );
    if (Object.keys(masterProfile).length > 0) {
      return masterProfile;
    }

    const coreFieldKeysByType: Record<GearType, string[]> = {
      reels: ['GEAR RATIO', 'WEIGHT', 'MAX DRAG', 'DRAG', 'cm_per_turn', 'spool_diameter_per_turn_mm'],
      rods: ['TOTAL LENGTH', 'Action', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'PIECES'],
      lures: ['TYPE', 'Length', 'Weight', 'Buoyancy', 'Range'],
      lines: ['SIZE NO.', 'LENGTH(m)', 'MAX STRENGTH(lb)', 'MAX STRENGTH(kg)', 'Market Reference Price'],
    };

    const compareGroup = this.normalizeText(master.type || master.system || type);
    const traits = this.buildGscTraits(type, master, variant || null);
    const warningHints = Array.isArray(traits.compareWarnings) ? traits.compareWarnings : [];
    const variantCount = Array.isArray(variants) ? variants.length : 0;

    return {
      compareGroup,
      compareGroupLabel: compareGroup,
      compareType: type,
      coreFieldKeys: coreFieldKeysByType[type] || [],
      warningHints,
      fitStyleTags: Array.isArray(traits.fitStyleTags) ? traits.fitStyleTags : [],
      variantCount: variantCount || undefined,
    };
  }

  private normalizeTraitObject(value: any) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return { ...value };
  }

  private collectFitStyleTags(
    type: GearType,
    master: Record<string, any>,
    variant: Record<string, any> | null,
  ) {
    const values: string[] = [];
    const pushText = (value: any) => {
      const text = this.normalizeText(value);
      if (text && !values.includes(text)) {
        values.push(text);
      }
    };

    if (type === 'reels') {
      pushText(master.type);
      pushText(master.type_tips);
    } else if (type === 'rods') {
      pushText(master.type);
      pushText(master.action);
      pushText(master.type_tips);
    } else if (type === 'lines') {
      pushText(master.type_tips);
      pushText(master.alias);
    } else {
      pushText(master.system);
      pushText(master.water_column);
      pushText(master.action);
    }

    if (variant) {
      pushText(variant.TYPE);
      pushText(variant.Action);
    }

    return values.slice(0, 4);
  }

  private collectCompareWarnings(
    type: GearType,
    master: Record<string, any>,
    variant: Record<string, any> | null,
  ) {
    const warnings: string[] = [];
    if (type === 'reels') {
      const typeTips = this.normalizeText(master.type_tips);
      if (typeTips.includes('BFS') || typeTips.includes('精细')) {
        warnings.push('更偏精细');
      }
      const lineCupDepth = this.inferLineCupDepth(variant);
      if (lineCupDepth === 'shallow') {
        warnings.push('更偏浅线杯方向');
      }
    }

    if (type === 'rods') {
      const action = this.normalizeText((variant && variant.Action) || master.action);
      if (action.toLowerCase().includes('fast') || action.includes('快')) {
        warnings.push('调性更偏快');
      }
      const totalLength = this.normalizeText(variant && variant['TOTAL LENGTH']);
      if (totalLength && /^7(\.|')/.test(totalLength)) {
        warnings.push('长度方向已拉开');
      }
    }

    return warnings.slice(0, 3);
  }

  private inferLineCupDepth(variant: Record<string, any> | null) {
    if (!variant) {
      return '';
    }
    const sku = this.normalizeText(variant.SKU || variant.sku).toUpperCase();
    if (!sku) {
      return '';
    }
    if (sku.includes('SSS') || sku.includes('SS') || sku.includes('SHG') || sku.includes('SPOOL S')) {
      return 'shallow';
    }
    if (sku.includes('MD') || sku.includes('MGL')) {
      return 'mid';
    }
    if (sku.endsWith('HG') || sku.endsWith('XG')) {
      return '';
    }
    if (sku.includes('D')) {
      return 'deep';
    }
    return '';
  }

  private inferBrakeType(master: Record<string, any>, variant: Record<string, any> | null) {
    const source = [
      this.normalizeText(master.type_tips),
      this.normalizeText(master.alias),
      this.normalizeText(variant && variant['BRAKE SYSTEM']),
      this.normalizeText(variant && variant['Brake System']),
    ]
      .join(' ')
      .toLowerCase();

    if (!source) {
      return '';
    }
    if (source.includes('dc')) {
      return 'digital';
    }
    if (source.includes('mag') || source.includes('磁')) {
      return 'magnetic';
    }
    if (source.includes('svs') || source.includes('离心')) {
      return 'centrifugal';
    }
    return '';
  }

  private inferMinLureWeightHint(type: GearType, variant: Record<string, any> | null) {
    if (type !== 'reels' || !variant) {
      return '';
    }
    const raw = this.normalizeText(variant['LURE WEIGHT'] || variant['Jig Weight'] || '');
    if (!raw) {
      return '';
    }
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? `${match[1]}g+` : '';
  }

  private inferSolidTip(master: Record<string, any>, variant: Record<string, any> | null) {
    const source = [
      this.normalizeText(master.type_tips),
      this.normalizeText(variant && variant['Tip Diameter']),
      this.normalizeText(variant && variant['TYPE']),
    ]
      .join(' ')
      .toLowerCase();

    if (!source) {
      return null;
    }
    if (source.includes('实心') || source.includes('solid')) {
      return true;
    }
    if (source.includes('空心') || source.includes('tubular')) {
      return false;
    }
    return null;
  }

  private hydrateBrandRow(row: {
    id: string;
    name: string;
    raw_json: Record<string, any>;
  }) {
    const raw = { ...(row.raw_json || {}) };
    return {
      ...raw,
      id: Number(row.id),
      name: row.name || raw.name || '',
    };
  }

  private readExcelRows(fileName: string) {
    const workbook = XLSX.readFile(join(this.getExcelDir(), fileName));
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: '' });
  }

  private normalizeType(type?: string): GearType {
    if (type === 'rod' || type === 'rods') return 'rods';
    if (type === 'lure' || type === 'lures') return 'lures';
    if (type === 'line' || type === 'lines') return 'lines';
    return 'reels';
  }

  private typeToKind(type: GearType): GearKind {
    if (type === 'rods') return 'rod';
    if (type === 'lures') return 'lure';
    if (type === 'lines') return 'line';
    return 'reel';
  }

  private getExcelDir() {
    return (
      this.configService.get<string>('GEAR_EXCEL_DIR') ||
      join(process.cwd(), '..', 'GearSage-client', 'rate', 'excel')
    );
  }

  private getClientWebpDir() {
    return join(process.cwd(), '..', 'GearSage-client', 'rate', 'webp');
  }

  private normalizeText(value: any) {
    return String(value ?? '').trim();
  }

  private hasValue(value: any) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }
}
