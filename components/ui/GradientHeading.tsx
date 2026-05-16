export interface GradientHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientHeading({ children, className = "" }: GradientHeadingProps) {
  return (
    <h1
      className={`bg-linear-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-4xl font-medium tracking-tight text-transparent sm:text-5xl ${className}`}
    >
      {children}
    </h1>
  );
}
