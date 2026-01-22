import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Gift,
  Users,
  BarChart,
  Plus,
  Edit,
  Trash,
  RefreshCw,
  Filter,
  Settings,
  Heart,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import loyaltyService from "../../../services/loyaltyService";
import Modal from "../../../features/common/Modal";
import Table from "../../../features/common/Table";

const LoyaltyProgram = () => {
  const navigate = useNavigate();

  // State variables
  const [activeTab, setActiveTab] = useState("tiers");
  const [tiers, setTiers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "tiers" || activeTab === "all") {
        const tiersData = await loyaltyService.getLoyaltyTiers();
        setTiers(tiersData);
      }

      if (activeTab === "rewards" || activeTab === "all") {
        const rewardsData = await loyaltyService.getLoyaltyRewards();
        setRewards(rewardsData);
      }

      if (activeTab === "stats" || activeTab === "all") {
        const statsData = await loyaltyService.getLoyaltyStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading loyalty data:", error);
      toast.error("Gagal memuat data program loyalitas");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Program Loyalitas Pelanggan
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Kelola tier, reward, dan segmentasi pelanggan
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "tiers"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Award className="inline-block h-4 w-4 mr-2" />
            Tier Loyalitas
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "rewards"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Gift className="inline-block h-4 w-4 mr-2" />
            Reward & Hadiah
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stats"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BarChart className="inline-block h-4 w-4 mr-2" />
            Statistik & Analitik
          </button>
        </nav>
      </div>

      {/* Content for each tab */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`Cari ${
                activeTab === "tiers"
                  ? "tier"
                  : activeTab === "rewards"
                  ? "reward"
                  : "statistik"
              }...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </button>

            {activeTab !== "stats" && (
              <button
                onClick={() =>
                  activeTab === "tiers"
                    ? setShowTierModal(true)
                    : setShowRewardModal(true)
                }
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah {activeTab === "tiers" ? "Tier" : "Reward"}
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Placeholder - This will be replaced with actual content */}
        <div className="p-6 flex justify-center items-center min-h-[300px] border-t border-gray-200">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Fitur Program Loyalitas sedang dalam pengembangan</p>
              <p className="mt-2">Silakan cek kembali nanti</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgram;
