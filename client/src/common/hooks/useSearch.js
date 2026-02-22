import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useCabang } from "@features/cabang/hooks/useCabang";

/**
 * Custom hook for search functionality across the application
 * @returns {Object} Search functions and state
 */
const useSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const navigate = useNavigate();
  const { selectedCabang } = useCabang();

  // Search categories with their respective endpoints and search functions
  const searchCategories = [
    { id: "all", label: "Semua" },
    { id: "products", label: "Produk", endpoint: "/api/produk" },
    {
      id: "transactions",
      label: "Transaksi",
      endpoint: "/api/transaksi",
    },
    { id: "customers", label: "Pelanggan", endpoint: "/api/pelanggan" },
    { id: "suppliers", label: "Supplier", endpoint: "/api/supplier" },
    {
      id: "inventory",
      label: "Inventaris",
      endpoint: "/api/inventory",
    },
    { id: "users", label: "Pengguna", endpoint: "/api/users" },
    { id: "branches", label: "Cabang", endpoint: "/api/cabang" },
  ];

  /**
   * Perform search across all categories or in a specific category
   * @param {string} query - Search query
   * @param {string} category - Category to search in (default: "all")
   * @returns {Promise<Object>} Search results
   */
  const performSearch = useCallback(async (query, category = "all") => {
    if (!query || query.trim() === "") {
      setResults([]);
      return [];
    }

    setIsLoading(true);
    setResults([]);

    try {
      if (category === "all") {
        // Search across primary categories in parallel
        const primaryCategories = ["products", "transactions", "customers", "suppliers"];
        const searchPromises = searchCategories
          .filter((cat) => primaryCategories.includes(cat.id))
          .map((cat) => fetchCategoryResults(query, cat));

        const allResults = await Promise.all(searchPromises);
        
        const groupedResults = {};
        allResults.forEach((res) => {
          if (res.items.length > 0) {
            groupedResults[res.category] = res.items;
          }
        });

        setResults(groupedResults);
        return groupedResults;
      } else {
        // Search in specific category
        const categoryConfig = searchCategories.find(
          (cat) => cat.id === category
        );
        if (categoryConfig && categoryConfig.endpoint) {
          const res = await fetchCategoryResults(query, categoryConfig);
          const groupedResults = res.items.length > 0 ? { [category]: res.items } : {};
          setResults(groupedResults);
          return groupedResults;
        }
        return {};
      }
    } catch (error) {
      console.error("Search error:", error);
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [selectedCabang]);

  /**
   * Fetch search results for a specific category
   * @param {string} query - Search query
   * @param {Object} categoryConfig - Category configuration
   * @returns {Promise<Array>} Category search results
   */
  const fetchCategoryResults = async (query, categoryConfig) => {
    try {
      const params = {
        search: query,
        limit: 5,
      };

      // Add cabangId if applicable
      if (selectedCabang?.id && selectedCabang.id !== "global") {
        if (categoryConfig.id === "products") {
          params.cabangId = selectedCabang.id;
        } else if (categoryConfig.id === "transactions") {
          params.cabangId = selectedCabang.id;
        }
      }

      const response = await api.get(categoryConfig.endpoint, { params });
      
      // Handle the fact that our API returns data in different structures
      let items = [];
      if (response.data?.status || response.data?.success) {
        items = response.data.data;
        // If data is an object with a data property (pagination structure)
        if (items && !Array.isArray(items) && Array.isArray(items.data)) {
          items = items.data;
        }
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }

      // Map results to include category for the formatter in Header.jsx
      const mappedItems = (Array.isArray(items) ? items : []).map(item => ({
        ...item,
        category: categoryConfig.id
      }));

      return {
        category: categoryConfig.id,
        items: mappedItems
      };
    } catch (error) {
      console.error(`Error fetching ${categoryConfig.id}:`, error);
      return { category: categoryConfig.id, items: [] };
    }
  };

  /**
   * Navigate to the appropriate page for the selected search result
   * @param {Object} item - The selected search result
   */
  const handleResultClick = (item) => {
    switch (item.category) {
      case "products":
        navigate(`/products/${item.id}`);
        break;
      case "transactions":
        navigate(`/transactions/${item.id}`);
        break;
      case "customers":
        navigate(`/customers/${item.id}`);
        break;
      case "suppliers":
        navigate(`/suppliers/${item.id}`);
        break;
      case "inventory":
        if (item.type === "stock-opname") {
          navigate(`/inventory/stock-opname/${item.id}`);
        } else if (item.type === "transfer") {
          navigate(`/inventory/transfers/${item.id}`);
        } else {
          navigate(`/inventory`);
        }
        break;
      case "financial":
        navigate(`/financial/reports/${item.id}`);
        break;
      case "users":
        navigate(`/users/${item.id}`);
        break;
      case "branches":
        navigate(`/branches/${item.id}`);
        break;
      case "settings":
        navigate(item.path || "/settings");
        break;
      default:
        navigate("/dashboard");
    }
  };

  /**
   * Navigate to search results page for a full search
   * @param {string} query - Search query
   * @param {string} category - Category to search in
   */
  const navigateToSearchResults = (query, category = "all") => {
    if (query && query.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(query)}&category=${category}`);
    }
  };

  return {
    isLoading,
    results,
    searchCategories,
    performSearch,
    handleResultClick,
    navigateToSearchResults,
  };
};

export default useSearch;
