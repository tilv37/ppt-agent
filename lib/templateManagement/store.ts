import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface LayoutPatternRecord {
  id: string;
  name: string;
  description: string;
  category: "content" | "cover" | "section" | "conclusion";
  layoutJson: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRecord {
  id: string;
  type: "icon" | "illustration" | "chart" | "decoration";
  category: string;
  tags: string[];
  keywords: string[];
  description?: string;
  filePath: string;
  fileFormat: "svg" | "png" | "jpg";
  fileSize: number;
  width: number;
  height: number;
  aspectRatio: string;
  sourcePage?: number;
  sourceFile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTaskRecord {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  fileName: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

interface StoreShape {
  layoutPatterns: LayoutPatternRecord[];
  assets: AssetRecord[];
  assetTasks: AssetTaskRecord[];
}

const STORE_DIR = path.join(process.cwd(), "uploads", "template-management");
const STORE_FILE = path.join(STORE_DIR, "store.json");

async function ensureStore(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  try {
    await readFile(STORE_FILE, "utf-8");
  } catch {
    const initial: StoreShape = { layoutPatterns: [], assets: [], assetTasks: [] };
    await writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf-8");
  return JSON.parse(raw) as StoreShape;
}

async function writeStore(data: StoreShape): Promise<void> {
  await ensureStore();
  await writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function listLayoutPatterns(category?: string): Promise<LayoutPatternRecord[]> {
  const data = await readStore();
  const items = category ? data.layoutPatterns.filter((item) => item.category === category) : data.layoutPatterns;
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLayoutPattern(id: string): Promise<LayoutPatternRecord | null> {
  const data = await readStore();
  return data.layoutPatterns.find((item) => item.id === id) || null;
}

export async function createLayoutPattern(input: {
  name: string;
  description: string;
  category: LayoutPatternRecord["category"];
  layoutJson: string;
  imageUrl?: string;
  createdBy?: string;
}): Promise<LayoutPatternRecord> {
  const data = await readStore();
  const now = new Date().toISOString();
  const record: LayoutPatternRecord = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    category: input.category,
    layoutJson: input.layoutJson,
    imageUrl: input.imageUrl,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  data.layoutPatterns.push(record);
  await writeStore(data);
  return record;
}

export async function updateLayoutPattern(
  id: string,
  input: Partial<Pick<LayoutPatternRecord, "name" | "description" | "category" | "layoutJson" | "imageUrl">>
): Promise<LayoutPatternRecord | null> {
  const data = await readStore();
  const index = data.layoutPatterns.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const current = data.layoutPatterns[index];
  const updated: LayoutPatternRecord = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  data.layoutPatterns[index] = updated;
  await writeStore(data);
  return updated;
}

export async function deleteLayoutPattern(id: string): Promise<boolean> {
  const data = await readStore();
  const before = data.layoutPatterns.length;
  data.layoutPatterns = data.layoutPatterns.filter((item) => item.id !== id);
  if (data.layoutPatterns.length === before) {
    return false;
  }
  await writeStore(data);
  return true;
}

export async function createAssetTask(fileName: string): Promise<AssetTaskRecord> {
  const data = await readStore();
  const now = new Date().toISOString();
  const task: AssetTaskRecord = {
    id: randomUUID(),
    status: "processing",
    fileName,
    progress: 40,
    createdAt: now,
    updatedAt: now,
  };
  data.assetTasks.push(task);
  await writeStore(data);
  return task;
}

export async function completeAssetTask(taskId: string): Promise<AssetTaskRecord | null> {
  const data = await readStore();
  const index = data.assetTasks.findIndex((item) => item.id === taskId);
  if (index === -1) {
    return null;
  }
  const updated: AssetTaskRecord = {
    ...data.assetTasks[index],
    status: "completed",
    progress: 100,
    updatedAt: new Date().toISOString(),
  };
  data.assetTasks[index] = updated;
  await writeStore(data);
  return updated;
}

export async function getAssetTask(taskId: string): Promise<AssetTaskRecord | null> {
  const data = await readStore();
  return data.assetTasks.find((item) => item.id === taskId) || null;
}

export async function addAsset(input: Omit<AssetRecord, "id" | "createdAt" | "updatedAt">): Promise<AssetRecord> {
  const data = await readStore();
  const now = new Date().toISOString();
  const record: AssetRecord = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  data.assets.push(record);
  await writeStore(data);
  return record;
}

export async function listAssets(params?: { q?: string; type?: string; category?: string }): Promise<AssetRecord[]> {
  const data = await readStore();
  const q = params?.q?.toLowerCase().trim();

  return data.assets
    .filter((item) => {
      if (params?.type && item.type !== params.type) {
        return false;
      }
      if (params?.category && item.category !== params.category) {
        return false;
      }
      if (!q) {
        return true;
      }
      const searchable = [item.category, item.description || "", ...item.tags, ...item.keywords].join(" ").toLowerCase();
      return searchable.includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  const data = await readStore();
  return data.assets.find((item) => item.id === id) || null;
}

export async function updateAsset(
  id: string,
  input: Partial<Pick<AssetRecord, "type" | "category" | "tags" | "keywords" | "description">>
): Promise<AssetRecord | null> {
  const data = await readStore();
  const index = data.assets.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  const current = data.assets[index];
  const updated: AssetRecord = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  data.assets[index] = updated;
  await writeStore(data);
  return updated;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const data = await readStore();
  const before = data.assets.length;
  data.assets = data.assets.filter((item) => item.id !== id);
  if (before === data.assets.length) {
    return false;
  }
  await writeStore(data);
  return true;
}
