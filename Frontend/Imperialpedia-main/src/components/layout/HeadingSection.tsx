import Link from "next/link";

interface HeadingProps {
    tag?: string;
    /** Parent-category eyebrow (e.g. { label: "INVESTING", href: "/investing" } on the Bonds page). */
    eyebrow?: { label: string; href: string };
    title: string;

    description: string;
}

export default function HeadingSection({ eyebrow, title, description }: HeadingProps) {
    return (
        <div className="pt-14 pb-5 lg:pt-20 space-y-3 text-center px-4">
            {eyebrow && (
                <Link
                    href={eyebrow.href}
                    className="inline-block text-sm font-semibold text-blue-500 tracking-wider hover:underline"
                >
                    {eyebrow.label}
                </Link>
            )}
            <h1 className="text-4xl lg:text-5xl font-bold tracking-wide">
                {title}
            </h1>
            <p className="mt-3 text-muted-foreground tracking-wide font-light text-base lg:text-lg max-w-5xl mx-auto">
                {description}
            </p>
        </div>
    );
}
