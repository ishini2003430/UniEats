import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, ChevronRight } from 'lucide-react';

export default function VendorCard({ vendor }) {
  const navigate = useNavigate();

  // Defensive checks for vendor properties
  if (!vendor) return null;

  const vendorId = vendor._id || vendor.id;
  const vendorName = vendor.name || 'Unknown Vendor';
  const vendorImage = vendor.image || vendor.imageUrl || 'https://via.placeholder.com/300x200?text=Vendor';
  const isOpen = vendor.isOpen || vendor.status === 'open' || vendor.status === 'active';

  const handleDragStart = (e) => {
    // Prevent image dragging to allow clean clicks
    e.preventDefault();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl overflow-hidden flex flex-col h-full"
    >
      {/* Vendor Image */}
      <div className="relative w-full h-48 overflow-hidden bg-slate-100">
        {vendorImage ? (
          <img
            src={vendorImage}
            alt={vendorName}
            onDragStart={handleDragStart}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Store className="w-10 h-10" />
            <span className="text-sm">No Image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex items-center">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md border ${
              isOpen
                ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                : 'bg-rose-500/90 text-white border-rose-400/50'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Vendor Details */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-900 mb-2 truncate" title={vendorName}>
          {vendorName}
        </h3>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
             <Store className="w-4 h-4"/>
             <span>Campus Vendor</span>
          </div>

          <button
            onClick={() => navigate(`/vendor/${vendorId}`)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm hover:shadow active:scale-95"
          >
            View Menu
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
