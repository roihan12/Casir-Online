import { useState, useCallback, useEffect } from "react";
import productService from "../../products/services/produkService";

export const usePOSProducts = (selectedBranchId) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFrequentProducts, setShowFrequentProducts] = useState(false);
  const [frequentProducts, setFrequentProducts] = useState([]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    try {
      const params = { cabangId: selectedBranchId };
      if (selectedCategory) {
        params.kategoriId = selectedCategory;
      }

      const response = await productService.getAllProduk();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedCategory]);

  // Fetch frequent products
  const fetchFrequentProducts = useCallback(async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    try {
      const response =
        await productService.getProductRecommendations(selectedBranchId);
      setFrequentProducts(response.data || []);
      setShowFrequentProducts(true);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Failed to fetch frequent products:", error);
      setFrequentProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  // Search products
  const searchProducts = useCallback(
    async (query) => {
      if (!query.trim() || !selectedBranchId) return [];

      try {
        const response = await productService.searchProducts(
          query,
          selectedBranchId,
        );
        return response.data || [];
      } catch (error) {
        console.error("Failed to search products:", error);
        return [];
      }
    },
    [selectedBranchId],
  );

  // Get product by ID
  const getProductById = useCallback(async (productId) => {
    try {
      const response = await productService.getProductById(productId);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return null;
    }
  }, []);

  // Get all products (for search)
  const allProducts = showFrequentProducts ? frequentProducts : products;

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products when dependencies change
  useEffect(() => {
    if (selectedBranchId && !showFrequentProducts) {
      fetchProducts();
    }
  }, [selectedBranchId, selectedCategory, showFrequentProducts, fetchProducts]);

  return {
    products: allProducts,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    showFrequentProducts,
    setShowFrequentProducts,
    frequentProducts,
    fetchProducts,
    fetchFrequentProducts,
    searchProducts,
    getProductById,
  };
};
