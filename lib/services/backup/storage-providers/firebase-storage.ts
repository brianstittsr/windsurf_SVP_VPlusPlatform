import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { StorageProvider, StorageObject, StorageProviderType } from "../types";

export class FirebaseStorageProvider implements StorageProvider {
  name: string;
  type: StorageProviderType = "firebase";
  private pathPrefix: string;

  constructor(name: string, pathPrefix: string = "backups") {
    this.name = name;
    this.pathPrefix = pathPrefix;
  }

  private getFullPath(filePath: string): string {
    return `${this.pathPrefix}/${filePath}`;
  }

  async upload(data: Buffer, filePath: string): Promise<string> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const fullPath = this.getFullPath(filePath);
    const storageRef = ref(storage, fullPath);
    
    // Convert Buffer to Uint8Array for Firebase
    const uint8Array = new Uint8Array(data);
    
    await uploadBytes(storageRef, uint8Array, {
      contentType: "application/octet-stream",
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  }

  async download(filePath: string): Promise<Buffer> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const fullPath = this.getFullPath(filePath);
    const storageRef = ref(storage, fullPath);
    const downloadUrl = await getDownloadURL(storageRef);

    // Fetch the file content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(filePath: string): Promise<void> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const fullPath = this.getFullPath(filePath);
    const storageRef = ref(storage, fullPath);

    try {
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code !== "storage/object-not-found") {
        throw error;
      }
    }
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const searchPath = prefix ? this.getFullPath(prefix) : this.pathPrefix;
    const storageRef = ref(storage, searchPath);
    const objects: StorageObject[] = [];

    try {
      const result = await listAll(storageRef);

      for (const itemRef of result.items) {
        try {
          const metadata = await getMetadata(itemRef);
          objects.push({
            name: itemRef.name,
            path: itemRef.fullPath.replace(`${this.pathPrefix}/`, ""),
            size: metadata.size,
            lastModified: new Date(metadata.updated),
          });
        } catch (error) {
          console.warn(`Failed to get metadata for ${itemRef.fullPath}:`, error);
        }
      }

      // Recursively list subdirectories
      for (const folderRef of result.prefixes) {
        const subPath = folderRef.fullPath.replace(`${this.pathPrefix}/`, "");
        const subObjects = await this.list(subPath);
        objects.push(...subObjects);
      }
    } catch (error: any) {
      console.error("Error listing storage:", error);
    }

    return objects;
  }

  async exists(filePath: string): Promise<boolean> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const fullPath = this.getFullPath(filePath);
    const storageRef = ref(storage, fullPath);

    try {
      await getMetadata(storageRef);
      return true;
    } catch (error: any) {
      if (error.code === "storage/object-not-found") {
        return false;
      }
      throw error;
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    const fullPath = this.getFullPath(filePath);
    const storageRef = ref(storage, fullPath);
    
    // Firebase client SDK doesn't support signed URLs with expiration
    // This returns a regular download URL
    return await getDownloadURL(storageRef);
  }
}
