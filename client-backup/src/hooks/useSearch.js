import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for search functionality across the application
 * @returns {Object} Search functions and state
 */
const useSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  // Search categories with their respective endpoints and search functions
  const searchCategories = [
    { id: "all", label: "Semua" },
    { id: "products", label: "Produk", endpoint: "/api/products/search" },
    {
      id: "transactions",
      label: "Transaksi",
      endpoint: "/api/transactions/search",
    },
    { id: "customers", label: "Pelanggan", endpoint: "/api/customers/search" },
    { id: "suppliers", label: "Supplier", endpoint: "/api/suppliers/search" },
    {
      id: "inventory",
      label: "Operasi Inventaris",
      endpoint: "/api/inventory/search",
    },
    {
      id: "financial",
      label: "Data Keuangan",
      endpoint: "/api/financial/search",
    },
    { id: "users", label: "Pengguna", endpoint: "/api/users/search" },
    { id: "branches", label: "Cabang", endpoint: "/api/branches/search" },
    { id: "settings", label: "Pengaturan", endpoint: "/api/settings/search" },
  ];

  /**
   * Perform search across all categories or in a specific category
   * @param {string} query - Search query
   * @param {string} category - Category to search in (default: "all")
   * @returns {Promise<Array>} Search results
   */
  const performSearch = async (query, category = "all") => {
    if (!query || query.trim() === "") {
      setResults([]);
      return [];
    }

    setIsLoading(true);
    setResults([]);

    try {
      if (category === "all") {
        // Search across all categories in parallel
        const searchPromises = searchCategories
          .filter((cat) => cat.id !== "all" && cat.endpoint)
          .map((cat) => fetchCategoryResults(query, cat));

        const allResults = await Promise.all(searchPromises);
        const flattenedResults = allResults.flat();

        // Group by category
        const groupedResults = flattenedResults.reduce((acc, result) => {
          if (!acc[result.category]) {
            acc[result.category] = [];
          }
          acc[result.category].push(result);
          return acc;
        }, {});

        setResults(groupedResults);
        return groupedResults;
      } else {
        // Search in specific category
        const categoryConfig = searchCategories.find(
          (cat) => cat.id === category
        );
        if (categoryConfig && categoryConfig.endpoint) {
          const results = await fetchCategoryResults(query, categoryConfig);
          const groupedResults = { [category]: results };
          setResults(groupedResults);
          return groupedResults;
        }
        return [];
      }
    } catch (error) {
      console.error("Search error:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch search results for a specific category
   * @param {string} query - Search query
   * @param {Object} categoryConfig - Category configuration
   * @returns {Promise<Array>} Category search results
   */
  const fetchCategoryResults = async (query, categoryConfig) => {
    // In a real implementation, this would make an API call
    // For now, we'll simulate results based on the category

    // Mock implementation - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulated results for each category
        const mockResults = {
          products: [
            {
              id: "p1",
              name: "Keyboard Logitech K380",
              category: "products",
              type: "product",
              stock: 25,
            },
            {
              id: "p2",
              name: "Mouse Logitech M720",
              category: "products",
              type: "product",
              stock: 15,
            },
          ],
          transactions: [
            {
              id: "t1",
              number: "TRX-21092",
              category: "transactions",
              type: "transaction",
              date: "2023-04-01",
            },
            {
              id: "t2",
              number: "TRX-21088",
              category: "transactions",
              type: "transaction",
              date: "2023-03-30",
            },
          ],
          customers: [
            {
              id: "c1",
              name: "Ahmad Fadillah",
              category: "customers",
              type: "customer",
              email: "ahmad@example.com",
            },
            {
              id: "c2",
              name: "Budi Santoso",
              category: "customers",
              type: "customer",
              email: "budi@example.com",
            },
          ],
          suppliers: [
            {
              id: "s1",
              name: "PT Maju Jaya",
              category: "suppliers",
              type: "supplier",
              contact: "+6281234567890",
            },
            {
              id: "s2",
              name: "CV Abadi Sejahtera",
              category: "suppliers",
              type: "supplier",
              contact: "+6287654321098",
            },
          ],
          inventory: [
            {
              id: "i1",
              name: "Stock Opname - April 2023",
              category: "inventory",
              type: "stock-opname",
              date: "2023-04-05",
            },
            {
              id: "i2",
              name: "Transfer - TRF-202304001",
              category: "inventory",
              type: "transfer",
              date: "2023-04-02",
            },
          ],
          financial: [
            {
              id: "f1",
              name: "Laporan Penjualan - Maret 2023",
              category: "financial",
              type: "sales-report",
              date: "2023-04-01",
            },
            {
              id: "f2",
              name: "Laporan Pajak Q1 2023",
              category: "financial",
              type: "tax-report",
              date: "2023-04-15",
            },
          ],
          users: [
            {
              id: "u1",
              name: "Dewi Anggraini",
              category: "users",
              type: "user",
              role: "Kasir",
            },
            {
              id: "u2",
              name: "Eko Prasetyo",
              category: "users",
              type: "user",
              role: "Admin Cabang",
            },
          ],
          branches: [
            {
              id: "b1",
              name: "Cabang Kebon Jeruk",
              category: "branches",
              type: "branch",
              address: "Jl. Kebon Jeruk No. 15",
            },
            {
              id: "b2",
              name: "Cabang Kelapa Gading",
              category: "branches",
              type: "branch",
              address: "Jl. Kelapa Gading Blok M",
            },
          ],
          settings: [
            {
              id: "st1",
              name: "Pengaturan Pajak",
              category: "settings",
              type: "setting",
              path: "/settings/tax",
            },
            {
              id: "st2",
              name: "Pengaturan Printer",
              category: "settings",
              type: "setting",
              path: "/settings/printer",
            },
          ],
        };

        // Filter mock results based on the query
        const results = (mockResults[categoryConfig.id] || [])
          .filter((item) =>
            Object.values(item).some(
              (val) =>
                typeof val === "string" &&
                val.toLowerCase().includes(query.toLowerCase())
            )
          )
          .slice(0, 5); // Limit to 5 results per category

        resolve(results);
      }, 300); // Simulate network delay
    });
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
