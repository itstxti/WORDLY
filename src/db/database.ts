import Dexie, { Table } from 'dexie';

export interface WordDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
}

export class WordlyDatabase extends Dexie {
  documents!: Table<WordDocument>;

  constructor() {
    super('WordlyDB');
    this.version(1).stores({
      documents: 'id, title, updatedAt'
    });
  }
}

export const db = new WordlyDatabase();
