export interface TodoItem {
    _id: string;
    email: string;
    category: 'personal' | 'dev';
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    start_time?: string;
    end_time?: string;
    completed: boolean;
    show: string;
    sort?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    _id: string;
    project_name: string;
    github_url?: string;
    web_url?: string;
    created_at: string;
    expected_end_at?: string;
    actual_end_at?: string | null;
    description?: string;
    status: 'ongoing' | 'completed' | 'paused';
    team_members?: Array<{
        name: string;
        role: string;
        email: string;
    }>;
    technologies?: string[];
    tags?: string[];
    budget?: number;
    progress_percent?: number;
    last_updated?: string;
    show?: string;
}

export interface User {
    email: string;
    name: string;
    picture: string;
    role?: string;
}
