import React from "react";
import { useCabang } from "../context/CabangContext";
import { MapPin, Globe } from "lucide-react";

/**
 * Komponen untuk menampilkan indikator cabang yang sedang aktif
 *
 * @param {Object} props
 * @param {String} props.size - Ukuran tampilan (sm, md, lg)
 * @param {Boolean} props.showIcon - Tampilkan ikon atau tidak
 * @param {String} props.className - Class tambahan
 */
const CabangIndicator = ({ size = "md", showIcon = true, className = "" }) => {
  const { selectedCabang, isGlobalView } = useCabang();

  if (!selectedCabang) return null;

  // Tentukan ukuran teks dan padding berdasarkan size prop
  let textSize = "text-sm";
  let padding = "px-2 py-1";
  let iconSize = 14;

  if (size === "sm") {
    textSize = "text-xs";
    padding = "px-1.5 py-0.5";
    iconSize = 12;
  } else if (size === "lg") {
    textSize = "text-base";
    padding = "px-3 py-1.5";
    iconSize = 16;
  }

  return (
    <div
      className={`
        inline-flex items-center rounded-full ${padding} ${textSize} font-medium
        ${
          isGlobalView
            ? "bg-blue-100 text-blue-800"
            : "bg-indigo-100 text-indigo-800"
        }
        ${className}
      `}
    >
      {showIcon &&
        (isGlobalView ? (
          <Globe size={iconSize} className="mr-1" />
        ) : (
          <MapPin size={iconSize} className="mr-1" />
        ))}
      <span>{selectedCabang.namaCabang}</span>
    </div>
  );
};

export default CabangIndicator;
