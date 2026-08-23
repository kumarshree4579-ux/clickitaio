'use client';
import { useState } from 'react';

import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'How can I track my order?', a: 'You can track your order by logging into your account and visiting the "My Orders" section. You will also receive an email with tracking details once your order has been dispatched.' },
    { q: 'What is your return policy?', a: 'We offer a 30-day return policy for all unused items in their original packaging. Please ensure the tags are intact before initiating a return from your account dashboard.' },
    { q: 'How long does delivery take?', a: 'Delivery typically takes 3-5 business days depending on your location. Express delivery options are available at checkout for next-day arrival in select cities.' },
    { q: 'Do you offer international shipping?', a: 'Currently, we only ship nationwide. We hope to expand internationally soon! Keep an eye on our newsletter for updates regarding new shipping destinations.' },
  ];

  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      {/* Hero Banner */}
      <div className="bg-indigo-600 text-white pt-8 sm:pt-10 pb-16 sm:pb-20 px-3 sm:px-4 rounded-b-[32px] sm:rounded-b-[40px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-5"></div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4">Help & Support</h1>
          <p className="text-indigo-100 text-xs sm:text-base max-w-lg mx-auto mb-5 sm:mb-8">
            Need help with your recent orders or account? Search our FAQs or get in touch with our team.
          </p>
          
          <div className="relative max-w-xl mx-auto shadow-lg shadow-indigo-900/20 rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search for answers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 font-medium text-sm sm:text-base"
            />
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-50 to-white pt-10 sm:pt-16 pb-14 sm:pb-20 px-3 sm:px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 sm:mb-6">
            How can we help you?
          </h1>
          <p className="text-sm sm:text-lg text-gray-500 max-w-xl mx-auto">
            Need assistance? We're here to help. Browse our frequently asked questions or get in touch with our dedicated support team below.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 -mt-6 sm:-mt-8 relative z-20">
        
        {/* Contact Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <a href="mailto:support@ecomstore.com" className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center group">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Email Us</h3>
            <p className="text-gray-500 text-[10px] sm:text-sm font-medium truncate w-full">support@ecomstore.com</p>
          </a>

          <a href="tel:+18001234567" className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center group">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Call Us</h3>
            <p className="text-gray-500 text-[10px] sm:text-sm font-medium">+1 (800) 123-4567</p>
          </a>
        </div>

        {/* FAQs */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 px-1 sm:px-2">Frequently Asked Questions</h2>
          
          
          <div className="space-y-2 sm:space-y-3">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className={`font-semibold text-xs sm:text-base transition-colors pr-2 ${openFaq === i ? 'text-indigo-600' : 'text-gray-800'}`}>
                    {faq.q}
                  </span>
                  <span className={`ml-2 flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${openFaq === i ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 sm:px-6 sm:pb-6 text-gray-500 text-xs sm:text-sm leading-relaxed border-t border-gray-50 pt-3 sm:pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )) : (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
                <p className="text-gray-500">No FAQs found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
