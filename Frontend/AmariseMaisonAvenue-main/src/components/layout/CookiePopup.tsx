'use client'
import Link from "next/link";
import { useEffect, useState } from "react";

export const CookiePopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-x-0 z-[100] bottom-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-1000" role="dialog" aria-labelledby="popup-title">
            <div className="relative flex-col justify-center items-center w-full space-y-2">

                <p className="text-white text-xs leading-5 tracking-wide text-center text-balance">The cookie settings on this website are set to 'allow all cookies' to give you the very best experience. Please click Accept the Cookie to use this site.</p>
                <div className="flex gap-4 justify-center items-center">
                    <Link href="/privacy-policy" className=" px-4 py-2 text-neutral-500">Privacy Policy</Link>
                    <button onClick={handleAccept} className="text-white font-light bg-transparent lowercase px-4 py-2">accept</button>
                </div>
            </div>
        </div>
    );
};