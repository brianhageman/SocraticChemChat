
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

declare global {
  interface Window {
    renderMathInElement: (element: HTMLElement, options?: any) => void;
  }
}
