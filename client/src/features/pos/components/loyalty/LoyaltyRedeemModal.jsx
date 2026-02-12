import { useState } from "react";
import { FiGift, FiStar, FiX, FiCheck, FiAward } from "react-icons/fi";
import { useAvailableRewards, useRedeemReward } from "../../../loyalty/hooks/useLoyalty";

const LoyaltyRedeemModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  onRedeemSuccess 
}) => {
  const [selectedReward, setSelectedReward] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Handle different customer object structures (from search vs from API)
  const customerId = customer?.pelanggan_id || customer?.id || customer?.pelangganId;

  const { data: rewardsData, isLoading } = useAvailableRewards(customerId);
  const redeemMutation = useRedeemReward();

  const rewards = rewardsData?.data?.rewards || [];
  const currentPoints = rewardsData?.data?.current_points || customer?.poin || 0;

  console.log("Customer:", customer, "Customer ID:", customerId);
  console.log("Rewards Data:", rewardsData);

  const handleSelectReward = (reward) => {
    if (reward.is_eligible && reward.stock_available) {
      setSelectedReward(reward);
      setConfirming(true);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    try {
      const result = await redeemMutation.mutateAsync({
        pelangganId: customerId,
        rewardId: selectedReward.id,
        transaksiId: null // Will be linked after transaction
      });

      if (result.success) {
        onRedeemSuccess({
          rewardId: selectedReward.id,
          rewardName: selectedReward.name,
          rewardValue: selectedReward.reward_value,
          rewardType: selectedReward.reward_type,
          pointsUsed: selectedReward.points_required
        });
        onClose();
      }
    } catch (error) {
      console.error("Redeem error:", error);
    }
  };

  const handleBack = () => {
    setSelectedReward(null);
    setConfirming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiGift className="text-white" size={24} />
            <div>
              <h2 className="text-white font-bold text-lg">Tukar Poin</h2>
              <p className="text-white/80 text-sm">{customer?.namaPelanggan || customer?.nama_pelanggan || customer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX size={24} />
          </button>
        </div>

        {/* Points Balance */}
        <div className="p-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiStar className="text-amber-400" size={20} />
              <span className="text-gray-400">Saldo Poin:</span>
            </div>
            <span className="text-2xl font-bold text-amber-400">
              {currentPoints.toLocaleString()} poin
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-400 mt-3">Memuat reward...</p>
            </div>
          ) : confirming && selectedReward ? (
            // Confirmation view
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiGift className="text-white" size={32} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Konfirmasi Penukaran</h3>
                <p className="text-gray-400">Anda akan menukar:</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-medium">{selectedReward.name}</h4>
                <p className="text-gray-400 text-sm mt-1">{selectedReward.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-amber-400 font-bold">
                    -{selectedReward.points_required.toLocaleString()} poin
                  </span>
                  <span className="text-green-400 font-bold">
                    Rp {Number(selectedReward.reward_value).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  <strong>Sisa poin setelah penukaran:</strong>
                  <span className="ml-2 text-white font-bold">
                    {(currentPoints - selectedReward.points_required).toLocaleString()} poin
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  disabled={redeemMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {redeemMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      Tukarkan Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-8">
              <FiAward className="text-gray-500 mx-auto mb-3" size={48} />
              <p className="text-gray-400">Tidak ada reward tersedia</p>
            </div>
          ) : (
            // Rewards list
            <div className="space-y-3">
              {rewards.map((reward) => (
                <button
                  key={reward.id}
                  onClick={() => handleSelectReward(reward)}
                  disabled={!reward.is_eligible || !reward.stock_available}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    reward.is_eligible && reward.stock_available
                      ? "bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10"
                      : "bg-gray-800/50 border-gray-700 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{reward.name}</h4>
                      <p className="text-gray-400 text-sm mt-1">{reward.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-sm font-bold ${
                          reward.is_eligible ? "text-amber-400" : "text-gray-500"
                        }`}>
                          {reward.points_required.toLocaleString()} poin
                        </span>
                        <span className="text-green-400 text-sm">
                          Rp {Number(reward.reward_value).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!reward.is_eligible && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        Kurang {reward.points_short.toLocaleString()} poin
                      </span>
                    )}
                    {!reward.stock_available && reward.is_eligible && (
                      <span className="text-xs text-gray-400 bg-gray-500/10 px-2 py-1 rounded">
                        Habis
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyRedeemModal;
