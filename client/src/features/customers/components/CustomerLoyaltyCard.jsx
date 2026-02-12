import { FiStar, FiGift, FiTrendingUp, FiAward, FiClock } from "react-icons/fi";
import { useCustomerLoyaltyInfo, useAvailableRewards } from "../../loyalty/hooks/useLoyalty";

const CustomerLoyaltyCard = ({ customerId }) => {
  const { data: loyaltyData, isLoading } = useCustomerLoyaltyInfo(customerId);
  const { data: rewardsData } = useAvailableRewards(customerId);

  const loyaltyInfo = loyaltyData?.data || null;
  const availableRewards = rewardsData?.data?.rewards?.filter(r => r.is_eligible) || [];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white animate-pulse">
        <div className="h-6 w-32 bg-white/30 rounded mb-4" />
        <div className="h-10 w-24 bg-white/30 rounded" />
      </div>
    );
  }

  if (!loyaltyInfo) {
    return null;
  }

  const tierColor = loyaltyInfo.tier_color || "#6B7280";
  const nextTierProgress = loyaltyInfo.next_tier_points 
    ? Math.min(100, (loyaltyInfo.points / loyaltyInfo.next_tier_points) * 100) 
    : 100;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-xl">
      {/* Header with tier */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ backgroundColor: tierColor + "30" }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: tierColor }}
          >
            <FiAward className="text-white" size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Tier Loyalty</p>
            <h3 className="text-white font-bold text-lg">{loyaltyInfo.tier_name || "Member"}</h3>
          </div>
        </div>
        {loyaltyInfo.tier_discount > 0 && (
          <div className="bg-green-500/20 px-3 py-1 rounded-full">
            <span className="text-green-400 font-medium text-sm">
              {loyaltyInfo.tier_discount}% Discount
            </span>
          </div>
        )}
      </div>

      {/* Points Section */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Current Points */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <FiStar size={14} />
              <span>Saldo Poin</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">
              {(loyaltyInfo.points || 0).toLocaleString()}
            </p>
          </div>

          {/* Lifetime Points */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <FiTrendingUp size={14} />
              <span>Total Didapat</span>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {(loyaltyInfo.lifetime_points || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        {loyaltyInfo.next_tier_name && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress ke {loyaltyInfo.next_tier_name}</span>
              <span className="text-white">
                {loyaltyInfo.points_to_next_tier?.toLocaleString()} poin lagi
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${nextTierProgress}%`,
                  backgroundColor: tierColor
                }}
              />
            </div>
          </div>
        )}

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <FiGift className="text-pink-400" size={16} />
              Reward Tersedia ({availableRewards.length})
            </h4>
            <div className="space-y-2">
              {availableRewards.slice(0, 3).map((reward) => (
                <div 
                  key={reward.id}
                  className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{reward.name}</p>
                    <p className="text-amber-400 text-xs">{reward.points_required.toLocaleString()} poin</p>
                  </div>
                  <span className="text-green-400 text-sm font-medium">
                    Rp {Number(reward.reward_value).toLocaleString()}
                  </span>
                </div>
              ))}
              {availableRewards.length > 3 && (
                <p className="text-gray-500 text-xs text-center mt-2">
                  +{availableRewards.length - 3} reward lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {/* Points Expiry Warning */}
        {loyaltyInfo.points_expiring_soon > 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
            <FiClock className="text-red-400" size={18} />
            <p className="text-red-300 text-sm">
              <strong>{loyaltyInfo.points_expiring_soon.toLocaleString()}</strong> poin akan kadaluarsa dalam 30 hari
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoyaltyCard;
