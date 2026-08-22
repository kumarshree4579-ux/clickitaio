'use client';
import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: 'How can I track my order?', a: 'You can track your order by logging into your account and visiting the "My Orders" section. You will also receive an email with tracking details once your order has been dispatched.' },
    { q: 'What is your return policy?', a: 'We offer a 30-day return policy for all unused items in their original packaging. Please ensure the tags are intact before initiating a return from your account dashboard.' },
    { q: 'How long does delivery take?', a: 'Delivery typically takes 3-5 business days depending on your location. Express delivery options are available at checkout for next-day arrival in select cities.' },
    { q: 'Do you offer international shipping?', a: 'Currently, we only ship nationwide. We hope to expand internationally soon! Keep an eye on our newsletter for updates regarding new shipping destinations.' },
  ];

  return (
    <div className="flex-1 bg-gray-50/50 pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-50 to-white pt-16 pb-20 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Need assistance? We're here to help. Browse our frequently asked questions or get in touch with our dedicated support team below.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 sm:-mt-12 relative z-10">
        
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center group cursor-pointer">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-500 text-sm mb-6 flex-1 max-w-xs mx-auto leading-relaxed">
              Drop us a line anytime. We aim to respond to all inquiries within 24 hours during business days.
            </p>
            <a href="mailto:support@ecomstore.com" className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-800">
              support@ecomstore.com
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center group cursor-pointer">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
            <p className="text-gray-500 text-sm mb-6 flex-1 max-w-xs mx-auto leading-relaxed">
              Need immediate assistance? Our support team is available Mon-Fri from 9am to 6pm EST.
            </p>
            <a href="tel:+18001234567" className="inline-flex items-center font-semibold text-emerald-600 hover:text-emerald-800">
              +1 (800) 123-4567
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <div key={i} className="group">
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between text-left focus:outline-none focus-visible:bg-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <span className={`font-semibold text-base sm:text-lg transition-colors ${openFaq === i ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                      {faq.q}
                    </span>
                    <span className={`ml-6 flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-indigo-600 border-indigo-600 text-white transform rotate-180' : 'bg-white border-gray-200 text-gray-400 group-hover:border-indigo-200 group-hover:text-indigo-600'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-6 pb-6 sm:px-8 sm:pb-8 text-gray-600 text-base leading-relaxed bg-white">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
