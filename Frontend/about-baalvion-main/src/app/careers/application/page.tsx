"use client";



import { useState } from "react";



export default function CareersApplicationPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
        // form handling for real application would go here
    }

    return (
        <main className="min-h-screen bg-white p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-5">Career Application</h1>
                {submitted ? (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-100 rounded">
                        Thank you for your application. We will review your details and be in touch.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Name</span>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded border px-3 py-2"
                                placeholder="John Doe"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Email</span>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded border px-3 py-2"
                                placeholder="you@example.com"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Cover Letter</span>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="mt-1 block w-full rounded border px-3 py-2"
                                rows={5}
                                placeholder="Why do you want to join Baalvion?"
                            />
                        </label>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                        >
                            Submit Application
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
