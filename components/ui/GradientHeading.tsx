export interface GradientHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientHeading({ children, className = "" }: GradientHeadingProps) {
  return (
    <h1
      className={`bg-linear-to-r from-black via-zinc-600 to-black bg-clip-text text-4xl font-medium tracking-tight text-transparent sm:text-5xl dark:from-white dark:via-zinc-400 dark:to-white ${className}`}
    >
      {children}
    </h1>
  );
}
