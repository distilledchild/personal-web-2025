import React from 'react';
import { TodoKanbanView } from '../components/TodoKanbanView';

interface TodoNoteProps {
    user: any;
    isAuthorized: boolean;
    projects: any[];
}

export const TodoNote: React.FC<TodoNoteProps> = ({ user, isAuthorized, projects }) => {
    return (
        <TodoKanbanView
            user={user}
            isAuthorized={isAuthorized}
            projects={projects}
            category="note"
            createModalTitle="Create New Note"
        />
    );
};
