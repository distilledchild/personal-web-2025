// Google Analytics gtag.js type definitions
interface Window {
  gtag: (
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string,
    config?: {
      page_path?: string;
      send_page_view?: boolean;
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
}
