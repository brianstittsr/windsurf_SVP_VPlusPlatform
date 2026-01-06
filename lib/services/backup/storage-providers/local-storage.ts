import * as fs from "fs/promises";
import * as path from "path";
import { StorageProvider, StorageObject, StorageProviderType } from "../types";

export class LocalStorageProvider implements StorageProvider {
  name: string;
  type: StorageProviderType = "local";
  private basePath: string;

  constructor(name: string, basePath: string) {
    this.name = name;
    this.basePath = basePath;
  }

  private getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  async upload(data: Buffer, filePath: string): Promise<string> {
    const fullPath = this.getFullPath(filePath);
    const dir = path.dirname(fullPath);
    
    await this.ensureDirectory(dir);
    await fs.writeFile(fullPath, data);
    
    return fullPath;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const searchPath = prefix ? this.getFullPath(prefix) : this.basePath;
    const objects: StorageObject[] = [];

    try {
      await this.listRecursive(searchPath, objects);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }

    return objects;
  }

  private async listRecursive(dirPath: string, objects: StorageObject[]): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await this.listRecursive(fullPath, objects);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const relativePath = path.relative(this.basePath, fullPath);
        
        objects.push({
          name: entry.name,
          path: relativePath.replace(/\\/g, "/"),
          size: stats.size,
          lastModified: stats.mtime,
        });
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSize(filePath: string): Promise<number> {
    const fullPath = this.getFullPath(filePath);
    const stats = await fs.stat(fullPath);
    return stats.size;
  }

  async getTotalSize(): Promise<number> {
    const objects = await this.list();
    return objects.reduce((total, obj) => total + obj.size, 0);
  }
}
