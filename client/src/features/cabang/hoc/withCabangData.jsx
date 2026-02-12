import React, { useState, useEffect } from "react";
import { useCabang, GLOBAL_CABANG_ID } from "../context/CabangContext";

const withCabangData = (Component, fetchFunction, options = {}) => {
  const {
    loadOnMount = true,
    refreshOnCabangChange = true,
    transformData = (data) => data,
  } = options;

  return (props) => {
    const { selectedCabang, isGlobalView } = useCabang();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    console.log("selectedCabang in withCabangData", selectedCabang);
    console.log("loadOnMount", loadOnMount);

    const loadData = async () => {
      if (!selectedCabang) {
        console.log("No selected cabang, cannot load data");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("Attempting to fetch data for cabang:", selectedCabang.id);
        const result = await fetchFunction(selectedCabang.id);

        console.log("Fetch result:", result);
        setData(transformData(result));
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };

    // Load data when component mounts or when selectedCabang becomes available
    useEffect(() => {
      console.log("Checking conditions for data load", {
        loadOnMount,
        selectedCabang,
      });

      if (loadOnMount && selectedCabang) {
        console.log("Triggering initial data load");
        loadData();
      }
    }, [selectedCabang, loadOnMount]); // Added selectedCabang to dependency array

    // Reload data when cabang changes
    useEffect(() => {
      if (refreshOnCabangChange && selectedCabang) {
        console.log("Triggering cabang change data load");
        loadData();
      }
    }, [selectedCabang, refreshOnCabangChange]);

    return (
      <Component
        {...props}
        data={data}
        cabang={selectedCabang}
        isGlobalView={isGlobalView}
        isLoading={isLoading}
        error={error}
        reloadData={loadData}
      />
    );
  };
};

export default withCabangData;
