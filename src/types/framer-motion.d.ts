declare module 'framer-motion' {
  import { ComponentType, HTMLAttributes } from 'react';

  export interface MotionProps extends HTMLAttributes<HTMLElement> {
    initial?: object;
    animate?: object;
    exit?: object;
    transition?: object;
    variants?: object;
    layout?: boolean | 'position' | 'size' | 'preserve-aspect';
  }

  export interface MotionComponentProps extends MotionProps {
    children?: React.ReactNode;
  }

  export interface Motion {
    [key: string]: ComponentType<MotionComponentProps>;
  }

  export const motion: {
    [key: string]: ComponentType<MotionComponentProps>;
  };

  export const AnimatePresence: ComponentType<{
    children?: React.ReactNode;
    initial?: boolean;
    custom?: any;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }>;
}
