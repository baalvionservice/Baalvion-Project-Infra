export default function NewsAndEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-grow">{children}</main>;
}
