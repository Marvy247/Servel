import logger from '../utils/logger';

type DatabaseCollection = {
  [key: string]: any[];
};

export class Database {
  private static collections: DatabaseCollection = {};

  static async insert(collectionName: string, document: any): Promise<void> {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = [];
    }
    this.collections[collectionName].push(document);
    logger.debug(`Inserted document into ${collectionName}`);
  }

  static async find(
    collectionName: string,
    query: Record<string, any>,
    options?: { sort?: Record<string, number>; limit?: number }
  ): Promise<any[]> {
    if (!this.collections[collectionName]) {
      return [];
    }

    let results = this.collections[collectionName].filter(doc => {
      return Object.entries(query).every(([key, value]) => doc[key] === value);
    });

    if (options?.sort) {
      const [field, direction] = Object.entries(options.sort)[0];
      results.sort((a, b) => (a[field] > b[field] ? direction : -direction));
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  static async trimCollection(collectionName: string, limit: number): Promise<void> {
    if (this.collections[collectionName]?.length > limit) {
      this.collections[collectionName] = this.collections[collectionName].slice(-limit);
    }
  }
}
