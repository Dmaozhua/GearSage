import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import * as XLSX from 'xlsx';
import { DatabaseService } from '../../common/database.service';

type GearType = 'reels' | 'rods' | 'lures';
type GearKind = 'reel' | 'rod' | 'lure';

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
  reelDetails: Record<string, any[]>;
  rodDetails: any[];
  lureDetails: Record<string, any[]>;
  fieldSupport: Record<GearType, Record<string, boolean>>;
}

@Injectable()
export class GearService {
  private excelCache: GearCache | null = null;

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
      .map((item) => this.formatMasterItem(item, data.brandsMap));

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

    const master = this.formatMasterItem(item, data.brandsMap);
    const brand = data.brandsMap[this.normalizeText(item.brand_id)] || null;

    return {
      ...master,
      brand_name: brand?.name || '',
      brand: brand
        ? {
            id: String(brand.id),
            name: brand.name || '',
          }
        : null,
      variants: this.getVariantsForItem(normalizedType, item, data),
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

    const reelDetails: Record<string, any[]> = {};
    const rodDetails: any[] = [];
    const lureDetails: Record<string, any[]> = {};

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
      reelDetails,
      rodDetails,
      lureDetails,
      fieldSupport: {
        reels: this.buildFieldSupport(reels),
        rods: this.buildFieldSupport(rods),
        lures: this.buildFieldSupport(lures),
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
      reelDetails,
      rodDetails: this.readExcelRows('rod_detail.xlsx'),
      lureDetails,
      fieldSupport: {
        reels: this.buildFieldSupport(reels),
        rods: this.buildFieldSupport(rods),
        lures: this.buildFieldSupport(lures),
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
    return data.reels;
  }

  private getVariantsForItem(type: GearType, item: any, data: GearCache) {
    const itemId = this.normalizeText(item.id);

    if (type === 'reels') {
      const detailRows = data.reelDetails[this.normalizeText(item.type)] || [];
      return detailRows
        .filter((variant) => this.normalizeText(variant.reel_id) === itemId)
        .map((variant) => ({ ...variant }));
    }

    if (type === 'rods') {
      return data.rodDetails
        .filter((variant) => this.normalizeText(variant.rod_id) === itemId)
        .map((variant) => ({ ...variant }));
    }

    const detailRows = data.lureDetails[this.normalizeText(item.system)] || [];
    return detailRows
      .filter((variant) => this.normalizeText(variant.lure_id) === itemId)
      .map((variant) => ({ ...variant }));
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

  private formatMasterItem(item: any, brandsMap: Record<string, any>) {
    const brand = brandsMap[this.normalizeText(item.brand_id)] || null;
    const images = this.normalizeImages(item.images);
    return {
      ...item,
      id: Number(item.id),
      brand_id: item.brand_id,
      brand_name: brand?.name || '',
      images,
      imageUrl: images[0] || '/images/default-gear.png',
      displayName: this.buildDisplayName(item),
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
      id: Number(row.id),
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
    return 'reels';
  }

  private typeToKind(type: GearType): GearKind {
    if (type === 'rods') return 'rod';
    if (type === 'lures') return 'lure';
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
