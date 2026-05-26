
interface HeadingProps {
    tag?: string;
    title: string;

    description: string;
}

export default function HeadingSection({ tag, title, description }: HeadingProps) {
    return (
        <div className="pt-14 pb-5 lg:pt-20 space-y-3 text-center px-4">
            {tag && <p className="text-blue-700 tracking-wide">{tag}</p>}
            <h1 className="text-4xl lg:text-5xl font-bold tracking-wide">
                {title}
            </h1>
            <p className="mt-3 text-gray-500 tracking-wide font-light text-base lg:text-lg max-w-5xl mx-auto">
                {description}
            </p>
        </div>
    );
}