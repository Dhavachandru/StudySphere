import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

type Props = HTMLMotionProps<'div'> & { hover?: boolean };

export const GlassCard = forwardRef<HTMLDivElement, Props>(({ className = '', hover, children, ...rest }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={`glass rounded-2xl ${hover ? 'transition-transform duration-200 hover:-translate-y-0.5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
GlassCard.displayName = 'GlassCard';
