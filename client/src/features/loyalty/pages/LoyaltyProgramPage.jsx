import { useState } from "react";
import { FiAward, FiGift, FiUsers, FiTrendingUp, FiPlus, FiEdit2, FiTrash2, FiStar, FiRefreshCw } from "react-icons/fi";
import {
  useLoyaltyTiers,
  useLoyaltyRewards,
  useLoyaltyStats,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  useCreateReward,
  useUpdateReward,
  useDeleteReward
} from "../hooks/useLoyalty";

const LoyaltyProgramPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showTierModal, setShowTierModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [editingReward, setEditingReward] = useState(null);

  // Queries
  const { data: tiersData, isLoading: tiersLoading, refetch: refetchTiers } = useLoyaltyTiers();
  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useLoyaltyRewards();
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useLoyaltyStats();

  // Mutations
  const createTierMutation = useCreateTier();
  const updateTierMutation = useUpdateTier();
  const deleteTierMutation = useDeleteTier();
  const createRewardMutation = useCreateReward();
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();

  const tiers = tiersData?.data || [];
  const rewards = rewardsData?.data || [];
  const stats = statsData?.data || {};

  const handleRefresh = () => {
    refetchTiers();
    refetchRewards();
    refetchStats();
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FiTrendingUp },
    { id: "tiers", label: "Tier Membership", icon: FiAward },
    { id: "rewards", label: "Katalog Reward", icon: FiGift },
  ];

  // Tier Form Handler
  const handleSaveTier = async (data) => {
    if (editingTier) {
      await updateTierMutation.mutateAsync({ id: editingTier.loyalty_tier_id, data });
    } else {
      await createTierMutation.mutateAsync(data);
    }
    setShowTierModal(false);
    setEditingTier(null);
  };

  // Reward Form Handler
  const handleSaveReward = async (data) => {
    if (editingReward) {
      await updateRewardMutation.mutateAsync({ id: editingReward.loyalty_reward_id, data });
    } else {
      await createRewardMutation.mutateAsync(data);
    }
    setShowRewardModal(false);
    setEditingReward(null);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <FiAward className="text-indigo-600" />
            Loyalty Program
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Kelola program loyalitas pelanggan</p>
        </div>
        <button
          onClick={handleRefresh}
          className={`inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm ${
            (tiersLoading || rewardsLoading || statsLoading) ? "opacity-50" : ""
          }`}
          disabled={tiersLoading || rewardsLoading || statsLoading}
        >
          <FiRefreshCw className={`h-5 w-5 ${ (tiersLoading || rewardsLoading || statsLoading) ? "animate-spin" : "" }`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center transition-all ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Member"
              value={stats.members?.total_customers || 0}
              subtitle={`${stats.members?.active_members || 0} aktif`}
              icon={FiUsers}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
              loading={statsLoading}
            />
            <StatCard
              title="Total Saldo Poin"
              value={(stats.members?.total_points_balance || 0).toLocaleString()}
              subtitle="Poin beredar"
              icon={FiStar}
              bgColor="bg-amber-100"
              iconColor="text-amber-600"
              loading={statsLoading}
            />
            <StatCard
              title="Poin Didapat"
              value={(stats.monthly_activity?.points_earned || 0).toLocaleString()}
              subtitle={`${stats.monthly_activity?.earn_transactions || 0} transaksi`}
              icon={FiTrendingUp}
              bgColor="bg-green-100"
              iconColor="text-green-600"
              loading={statsLoading}
            />
            <StatCard
              title="Poin Ditukar"
              value={(stats.monthly_activity?.points_redeemed || 0).toLocaleString()}
              subtitle={`${stats.monthly_activity?.redeem_transactions || 0} penukaran`}
              icon={FiGift}
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              loading={statsLoading}
            />
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribusi Member per Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {stats.tier_distribution?.map((tier) => (
                <div key={tier.tier_name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tier.color || "#6B7280" }}
                      />
                      <span className="font-medium text-gray-700">{tier.tier_name}</span>
                    </div>
                    <span className="text-gray-500">{tier.member_count} member</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: tier.color || "#6B7280",
                        width: `${Math.min(100, (tier.member_count / (stats.members?.total_customers || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingTier(null); setShowTierModal(true); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm"
            >
              <FiPlus size={18} />
              Tambah Tier
            </button>
          </div>

          {tiersLoading ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.loyalty_tier_id}
                  tier={tier}
                  onEdit={() => { setEditingTier(tier); setShowTierModal(true); }}
                  onDelete={() => deleteTierMutation.mutate(tier.loyalty_tier_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingReward(null); setShowRewardModal(true); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm"
            >
              <FiPlus size={18} />
              Tambah Reward
            </button>
          </div>

          {rewardsLoading ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.loyalty_reward_id}
                  reward={reward}
                  onEdit={() => { setEditingReward(reward); setShowRewardModal(true); }}
                  onDelete={() => deleteRewardMutation.mutate(reward.loyalty_reward_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && (
        <TierModal
          tier={editingTier}
          onSave={handleSaveTier}
          onClose={() => { setShowTierModal(false); setEditingTier(null); }}
          loading={createTierMutation.isPending || updateTierMutation.isPending}
        />
      )}

      {/* Reward Modal */}
      {showRewardModal && (
        <RewardModal
          reward={editingReward}
          onSave={handleSaveReward}
          onClose={() => { setShowRewardModal(false); setEditingReward(null); }}
          loading={createRewardMutation.isPending || updateRewardMutation.isPending}
        />
      )}
    </div>
  );
};

// Sub Components
const StatCard = ({ title, value, subtitle, icon: Icon, bgColor, iconColor, loading }) => (
  <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 ${bgColor} rounded-xl flex-shrink-0`}>
      <Icon className={iconColor} size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">{title}</p>
      {loading ? (
        <div className="h-7 w-20 bg-gray-100 rounded animate-pulse my-1" />
      ) : (
        <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
      )}
      <p className="text-gray-400 text-[10px] sm:text-xs truncate">{subtitle}</p>
    </div>
  </div>
);

const TierCard = ({ tier, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-indigo-200 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-inner"
        style={{ backgroundColor: tier.color || "#6B7280" }}
      >
        <FiAward />
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <FiEdit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
    <p className="text-gray-500 text-sm mt-1">
      {tier.min_points?.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : "∞"} poin
    </p>
    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
      <span className="text-indigo-600 font-semibold text-sm">{tier.discount_percent}% Diskon</span>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-medium">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
        Active
      </div>
    </div>
  </div>
);

const RewardCard = ({ reward, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-indigo-200 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-purple-100 rounded-xl">
        <FiGift className="text-purple-600" size={20} />
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <FiEdit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{reward.description}</p>
    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-amber-600 font-bold text-sm tracking-tight">{reward.points_required?.toLocaleString()} Poin</span>
        <span className="text-[10px] text-gray-400 uppercase font-bold">Dibutuhkan</span>
      </div>
      <div className="text-right">
        <span className="text-green-600 font-bold text-sm">Rp {Number(reward.reward_value || 0).toLocaleString()}</span>
        <span className="block text-[10px] text-gray-400 uppercase font-bold">Nilai Reward</span>
      </div>
    </div>
  </div>
);

const TierModal = ({ tier, onSave, onClose, loading }) => {
  const [form, setForm] = useState({
    name: tier?.name || "",
    min_points: tier?.min_points || 0,
    max_points: tier?.max_points || "",
    discount_percent: tier?.discount_percent || 0,
    color: tier?.color || "#6B7280",
    icon: tier?.icon || "star"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      max_points: form.max_points === "" ? null : parseInt(form.max_points)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {tier ? "Edit Tier" : "Tambah Tier Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Nama Tier</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Gold"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Min Poin</label>
              <input
                type="number"
                value={form.min_points}
                onChange={(e) => setForm({ ...form, min_points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Max Poin</label>
              <input
                type="number"
                value={form.max_points}
                onChange={(e) => setForm({ ...form, max_points: e.target.value })}
                placeholder="∞"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Discount (%)</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Warna</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RewardModal = ({ reward, onSave, onClose, loading }) => {
  const [form, setForm] = useState({
    name: reward?.name || "",
    description: reward?.description || "",
    points_required: reward?.points_required || 0,
    reward_type: reward?.reward_type || "DISCOUNT",
    reward_value: reward?.reward_value || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {reward ? "Edit Reward" : "Tambah Reward Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Nama Reward</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g. Free Coffee"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Write a short description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Poin Dibutuhkan</label>
              <input
                type="number"
                value={form.points_required}
                onChange={(e) => setForm({ ...form, points_required: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Tipe Reward</label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm({ ...form, reward_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
              >
                <option value="DISCOUNT">Diskon</option>
                <option value="FREE_PRODUCT">Produk Gratis</option>
                <option value="CASHBACK">Cashback</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Nilai Reward (Rp)</label>
            <input
              type="number"
              value={form.reward_value}
              onChange={(e) => setForm({ ...form, reward_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoyaltyProgramPage;
