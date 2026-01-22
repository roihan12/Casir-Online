import { useContext } from "react";
import { CabangContext } from "../context/CabangContext";

// Re-export useCabang for convenience
export const useCabang = () => {
  const context = useContext(CabangContext);
  if (context === undefined) {
    throw new Error("useCabang must be used within a CabangProvider");
  }
  return context;
};

export { GLOBAL_CABANG_ID } from "../context/CabangContext";
