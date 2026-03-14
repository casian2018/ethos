/**
 * Train Section Layout
 */

export default function TrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {children}
    </div>
  );
}
