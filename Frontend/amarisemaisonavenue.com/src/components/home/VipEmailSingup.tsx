import { useState } from "react";

export function VipEmailSignup() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");


    return (
      <section className="bg-cream/50 py-8 lg:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-4">
          <h3 className="text-[16px] sm:text-[24px] font-serif font-normal text-gray-900 tracking-wider">
            Join the VIP Email List
          </h3>
          <p className="text-[11px] text-gray-500 font-light">
            Join our VIP email list and get first access new product launches and
            all the latest updates from Amarisé Maison !
          </p>
          {subscribed ? (
            <p className="text-[11px] font-semibold text-green-700 tracking-wide">
              You have successfully subscribed!
            </p>
          ) : (
            <div className="flex border border-gray-300 bg-white max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 h-[50px] px-5 text-[13px] outline-none placeholder:text-gray-400 bg-white"
              />
              <button 
                onClick={() => {
                  if (email) setSubscribed(true);
                }}
                className="h-[50px] px-7 text-black  font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors shrink-0"
              >
                SUBMIT
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }