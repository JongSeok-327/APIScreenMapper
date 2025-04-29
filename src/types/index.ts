export interface Project {
    id?: number;
    name: string;
    description?: string;
    createdAt: number;
}

export interface Screen {
    id?: number;
    projectId: number;
    name: string;
    imageUrl: string;
    description?: string;
    order: number;
}

export interface GraphQLAPI {
    id?: number;
    screenId: number;
    name: string;
    type: 'query' | 'mutation';
    code: string;
    description?: string;
    position?: {
        x: number;
        y: number;
    };
} 