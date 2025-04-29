import Dexie, { Table } from 'dexie';
import { Project, Screen, GraphQLAPI } from '../types';

export class AppDatabase extends Dexie {
    projects!: Table<Project>;
    screens!: Table<Screen>;
    apis!: Table<GraphQLAPI>;

    constructor() {
        super('GraphQLScreenMapper');
        
        this.version(1).stores({
            projects: '++id, name, createdAt',
            screens: '++id, projectId, name, order',
            apis: '++id, screenId, name, type'
        });
    }
}

export const db = new AppDatabase(); 