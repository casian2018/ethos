import { cn } from "@/lib/utils";

interface EthosCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "ghost";
  hover?: boolean;
}

export function EthosCard({
  children,
  className,
  variant = "default",
  hover = false,
  ...props
}: EthosCardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border text-card-foreground ethos-panel",
        "transition-all duration-300 ease-in-out",
        variant === "outline" && "border-[1.5px] border-primary/35 bg-card/40 shadow-none",
        variant === "ghost" && "border-transparent bg-transparent shadow-none backdrop-blur-none",
        hover && "ethos-card-lift",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function EthosCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 p-6 md:p-7", className)}
      {...props}
    />
  );
}

export function EthosCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-2xl font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function EthosCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function EthosCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 md:p-7 md:pt-0", className)} {...props} />;
}

export function EthosCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0 md:p-7 md:pt-0", className)}
      {...props}
    />
  );
}
