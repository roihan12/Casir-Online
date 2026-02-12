import { FiStar, FiGift, FiChevronRight } from "react-icons/fi";
import { useCustomerLoyaltyInfo } from "../../../loyalty/hooks/useLoyalty";

const LoyaltyBadge = ({ customer, onClick }) => {
  // Handle different customer object structures (from search vs from API)
  const customerId = customer?.pelanggan_id || customer?.id || customer?.pelangganId;
  
  const { data: loyaltyData, isLoading } = useCustomerLoyaltyInfo(customerId);
  
  const loyaltyInfo = loyaltyData?.data || null;
  const points = loyaltyInfo?.points || customer?.poin || 0;
  const tierName = loyaltyInfo?.tier_name || "Member";
  const tierColor = loyaltyInfo?.tier_color || "#6B7280";

  if (!customer) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-all group"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: tierColor }}
      >
        <FiStar className="text-white" size={18} />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{customer.namaPelanggan || customer.nama_pelanggan || customer.name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: tierColor }}
          >
            {tierName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              <FiStar size={14} />
              <span className="font-bold">{points.toLocaleString()}</span>
              <span className="text-gray-400">poin tersedia</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-amber-400">
        <FiGift size={16} />
        <span className="text-xs font-medium hidden sm:inline">Tukar Poin</span>
        <FiChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

export default LoyaltyBadge;
