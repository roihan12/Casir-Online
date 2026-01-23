import { useState, useEffect, useCallback, useRef } from "react";
import api from "@common/utils/api";
import toast from "react-hot-toast";

/**
 * Custom hook to manage frequently used products
 * @param {string} cabangId - The ID of the branch to fetch products for
 * @param {Function} onToggle - Optional callback when toggling the view
 * @returns {Object} - The hook state and functions
 */
export default function useFrequentProducts(cabangId, onToggle) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Use a ref to track previous cabangId to avoid unnecessary fetches
  const prevCabangIdRef = useRef(cabangId);

  // Use a ref for onToggle to avoid dependency issues
  const onToggleRef = useRef(onToggle);

  // Update the ref when onToggle changes
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!cabangId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/produk/frequent/${cabangId}`);

      if (response.data && response.data.data) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching frequent products:", err);
      setError(err);
      toast.error("Gagal memuat produk yang sering digunakan");
    } finally {
      setIsLoading(false);
    }
  }, [cabangId]);

  // Toggle function
  const toggleFrequentProducts = useCallback(() => {
    if (!cabangId) {
      toast.error("Pilih cabang terlebih dahulu");
      return false;
    }

    setIsActive((prevIsActive) => {
      const newState = !prevIsActive;

      // If activating, fetch data
      if (newState) {
        fetchData();
      }

      // Call onToggle through the ref to avoid dependency issues
      if (onToggleRef.current) {
        onToggleRef.current(newState);
      }

      return newState;
    });

    return true;
  }, [cabangId, fetchData]);

  // Effect to refetch data when cabangId changes and isActive is true
  useEffect(() => {
    // Only refetch if cabangId changed and isActive
    if (isActive && cabangId && cabangId !== prevCabangIdRef.current) {
      fetchData();
    }

    // Update the ref
    prevCabangIdRef.current = cabangId;
  }, [cabangId, isActive, fetchData]);

  // Reset function
  const reset = useCallback(() => {
    setData([]);
    setIsActive(false);
    setError(null);
  }, []);

  return {
    frequentProducts: data,
    isLoading,
    error,
    isActive,
    toggleFrequentProducts,
    reset,
  };
}
