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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <FiAward className="text-white" size={28} />
              </div>
              Loyalty Program
            </h1>
            <p className="text-gray-400 mt-2">Kelola program loyalitas pelanggan</p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
          >
            <FiRefreshCw size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 bg-white/5 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Member"
              value={stats.members?.total_customers || 0}
              subtitle={`${stats.members?.active_members || 0} member aktif`}
              icon={FiUsers}
              color="from-blue-500 to-cyan-500"
              loading={statsLoading}
            />
            <StatCard
              title="Total Saldo Poin"
              value={(stats.members?.total_points_balance || 0).toLocaleString()}
              subtitle="Poin beredar"
              icon={FiStar}
              color="from-amber-500 to-orange-500"
              loading={statsLoading}
            />
            <StatCard
              title="Poin Didapat (Bulan Ini)"
              value={(stats.monthly_activity?.points_earned || 0).toLocaleString()}
              subtitle={`${stats.monthly_activity?.earn_transactions || 0} transaksi`}
              icon={FiTrendingUp}
              color="from-green-500 to-emerald-500"
              loading={statsLoading}
            />
            <StatCard
              title="Poin Ditukar (Bulan Ini)"
              value={(stats.monthly_activity?.points_redeemed || 0).toLocaleString()}
              subtitle={`${stats.monthly_activity?.redeem_transactions || 0} penukaran`}
              icon={FiGift}
              color="from-purple-500 to-pink-500"
              loading={statsLoading}
            />
          </div>

          {/* Tier Distribution */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Distribusi Member per Tier</h3>
            <div className="space-y-4">
              {stats.tier_distribution?.map((tier) => (
                <div key={tier.tier_name} className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tier.color || "#6B7280" }}
                  />
                  <span className="text-white flex-1">{tier.tier_name}</span>
                  <span className="text-gray-400">{tier.member_count} member</span>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
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
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <FiPlus size={18} />
              Tambah Tier
            </button>
          </div>

          {tiersLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <FiPlus size={18} />
              Tambah Reward
            </button>
          </div>

          {rewardsLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
const StatCard = ({ title, value, subtitle, icon: Icon, color, loading }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-gradient-to-br ${color} rounded-xl`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-white">{value}</p>
        )}
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
    </div>
  </div>
);

const TierCard = ({ tier, onEdit, onDelete }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
        style={{ backgroundColor: tier.color || "#6B7280" }}
      >
        <FiAward />
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
          <FiEdit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
    <p className="text-gray-400 text-sm mt-1">
      {tier.min_points?.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : "∞"} poin
    </p>
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-amber-400 font-medium">{tier.discount_percent}% Discount</p>
    </div>
  </div>
);

const RewardCard = ({ reward, onEdit, onDelete }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
        <FiGift className="text-white" size={20} />
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
          <FiEdit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-white">{reward.name}</h3>
    <p className="text-gray-400 text-sm mt-1">{reward.description}</p>
    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
      <span className="text-amber-400 font-bold">{reward.points_required?.toLocaleString()} poin</span>
      <span className="text-green-400">Rp {Number(reward.reward_value || 0).toLocaleString()}</span>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">
          {tier ? "Edit Tier" : "Tambah Tier Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nama Tier</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Min Poin</label>
              <input
                type="number"
                value={form.min_points}
                onChange={(e) => setForm({ ...form, min_points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-amber-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Poin</label>
              <input
                type="number"
                value={form.max_points}
                onChange={(e) => setForm({ ...form, max_points: e.target.value })}
                placeholder="∞"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Discount (%)</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Warna</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">
          {reward ? "Edit Reward" : "Tambah Reward Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nama Reward</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Poin Dibutuhkan</label>
              <input
                type="number"
                value={form.points_required}
                onChange={(e) => setForm({ ...form, points_required: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Tipe Reward</label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm({ ...form, reward_type: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
              >
                <option value="DISCOUNT">Diskon</option>
                <option value="FREE_PRODUCT">Produk Gratis</option>
                <option value="CASHBACK">Cashback</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nilai Reward (Rp)</label>
            <input
              type="number"
              value={form.reward_value}
              onChange={(e) => setForm({ ...form, reward_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
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
