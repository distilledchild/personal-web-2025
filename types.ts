export enum Section {
  Home = 'Home',
  About = 'About',
  Research = 'Research',
  Tech = 'Tech',
  Contact = 'Contact'
}

export interface GeneData {
  gene: string;
  interactionStrength: number;
  distance: number;
  type: 'Promoter-Enhancer' | 'Promoter-Promoter';
}

export interface ResearchTab {
  id: string;
  label: string;
  color: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}