export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-grow">{children}</main>;
}
