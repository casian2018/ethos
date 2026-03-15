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
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        "transition-all duration-300 ease-in-out",
        variant === "outline" && "border-2 border-primary/50 bg-transparent",
        variant === "ghost" && "bg-transparent shadow-none border-none",
        hover && "hover:shadow-md hover:-translate-y-0.5",
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
      className={cn("flex flex-col space-y-1.5 p-6", className)}
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
        "text-xl font-semibold leading-none tracking-tight",
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
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function EthosCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function EthosCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}
