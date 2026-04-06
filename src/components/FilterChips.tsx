import { motion } from 'framer-motion';

const filters = ['All', 'Recent', 'AI Tagged', 'With Code', 'Checklists', 'Pinned'];

interface FilterChipsProps {
  active: string;
  onChange: (filter: string) => void;
}

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className="relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
        >
          {active === filter && (
            <motion.div
              layoutId="filter-chip"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${active === filter ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {filter}
          </span>
        </button>
      ))}
    </div>
  );
}
