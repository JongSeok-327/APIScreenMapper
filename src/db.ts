import Dexie, { Table, Transaction } from 'dexie';
import { Project, Screen, GraphQLAPI } from './types';

export class AppDatabase extends Dexie {
  projects!: Table<Project>;
  screens!: Table<Screen>;
  apis!: Table<GraphQLAPI>;

  constructor() {
    super('graphql-screen-mapper');
    
    this.version(1).stores({
      projects: '++id, name',
      screens: '++id, projectId, name',
      apis: '++id, screenId, name, type'
    });

    this.version(2).stores({
      projects: '++id, name, createdAt',
      screens: '++id, projectId, name, order',
      apis: '++id, screenId, name, type, order'
    }).upgrade(async (tx: Transaction) => {
      const projects = await this.projects.toArray();
      await Promise.all(
        projects.map(project => 
          this.projects.update(project.id!, { createdAt: Date.now() })
        )
      );

      const screens = await this.screens.toArray();
      await Promise.all(
        screens.map((screen, index) => 
          this.screens.update(screen.id!, { order: index })
        )
      );

      const apis = await this.apis.toArray();
      await Promise.all(
        apis.map((api, index) => 
          this.apis.update(api.id!, { order: index })
        )
      );
    });
  }
}

export const db = new AppDatabase(); 