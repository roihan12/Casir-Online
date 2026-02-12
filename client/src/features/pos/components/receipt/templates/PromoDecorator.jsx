import React from "react";
import formatCurrency from "@common/utils/formatCurrency";
import { Tag, CheckCircle } from "lucide-react";

/**
 * PromoDecorator HOC
 * Higher-Order Component that adds promo section to any receipt template
 *
 * Usage: withPromo(CashReceipt)
 */
const withPromo = (WrappedComponent) => {
  return (props) => {
    const { data } = props;
    const { promo } = data;

    // Only show promo section if there are promos applied
    const hasPromo = promo?.hasPromo && promo?.promosApplied?.length > 0;

    if (!hasPromo) {
      // No promo, render original component
      return <WrappedComponent {...props} />;
    }

    // Merge promo discount into transaction data for the wrapped component
    const enhancedData = {
      ...data,
      promo: {
        ...promo,
        // Add promo discount to the component
        showPromoSection: true,
      },
    };

    return (
      <div className="space-y-2">
        {/* Promo Summary Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mx-auto max-w-[320px]">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase">
              Promo Berlaku
            </span>
            <span className="ml-auto text-[10px] font-bold text-green-700">
              -{formatCurrency(promo.totalDiskonPromo)}
            </span>
          </div>
          {promo.promosApplied.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center text-[9px] text-green-600">
              <span className="flex items-center gap-1">
                <Tag size={8} />
                {p.kodePromo}
              </span>
              <span>{p.namaPromo}</span>
              <span className="font-semibold">
                -{formatCurrency(p.diskonAmount)}
              </span>
            </div>
          ))}
        </div>

        {/* Render original receipt with enhanced data */}
        <WrappedComponent {...props} data={enhancedData} />
      </div>
    );
  };
};

export default withPromo;
