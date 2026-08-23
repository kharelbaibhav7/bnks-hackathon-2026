import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1];

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease },
};

export function FadeIn({ children, delay = 0, className, style, as: Tag = motion.div }) {
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease }}
    >
      {children}
    </Tag>
  );
}

export function Stagger({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.24, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export default function PageMotion({ children }) {
  const location = useLocation();
  return (
    <motion.div key={location.pathname} {...fadeUp}>
      {children}
    </motion.div>
  );
}
