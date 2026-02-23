import { ChevronDown, CreditCardIcon, DollarSignIcon, Smartphone, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import formatCurrency from "@common/utils/formatCurrency";

const PaymentMethodChart = ({ isGlobalView, cabang, paymentMethods }) => {
  // Use the payment methods data from API response
  const { summary, globalMethods } = paymentMethods || {
    summary: { totalVolume: 0, methodCount: 0, mostPopular: "N/A" },
    globalMethods: [],
  };

  console.log(paymentMethods);

  // Map payment method to icon and color
  const getMethodDetails = (method) => {
    const methodMap = {
      TUNAI: {
        icon: <DollarSignIcon size={16} />,
        color: "emerald",
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-600",
        borderColor: "border-emerald-400",
      },
      TRANSFER: {
        icon: <CreditCardIcon size={16} />,
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
        borderColor: "border-blue-400",
      },
      QRIS: {
        icon: <Smartphone size={16} />,
        color: "purple",
        bgColor: "bg-purple-100",
        textColor: "text-purple-600",
        borderColor: "border-purple-400",
      },
      DEBIT: {
        icon: <CreditCardIcon size={16} />,
        color: "yellow",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-400",
      },
      KARTU_KREDIT: {
        icon: <CreditCardIcon size={16} />,
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-600",
        borderColor: "border-red-400",
      },
    };

    return (
      methodMap[method] || {
        icon: <Wallet size={16} />,
        color: "gray",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        borderColor: "border-gray-400",
      }
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium">
          {isGlobalView
            ? "Metode Pembayaran (Semua Cabang)"
            : `Metode Pembayaran (${cabang})`}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-indigo-100 text-indigo-600 py-1 px-2 rounded-full">
            {summary.methodCount} metode
          </span>
          <button className="flex items-center text-xs text-gray-500">
            <span>30 Hari</span>
            <ChevronDown size={14} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Total Volume</div>
          <div className="text-lg font-semibold">
            {formatCurrency(summary.totalVolume)}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Metode Terpopuler</div>
          <div className="text-lg font-semibold">{summary.mostPopular}</div>
        </div>
      </div>

      {/* Payment Methods Visualization */}
      <div className="space-y-3">
        {globalMethods.map((method) => {
          const details = getMethodDetails(method.method);
          const percentage = parseFloat(method.percentage);

          return (
            <div key={method.method} className="relative">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <div
                    className={`p-1 rounded ${details.bgColor} ${details.textColor} mr-2`}
                  >
                    {details.icon}
                  </div>
                  <span className="text-sm font-medium">{method.method}</span>
                  {method.provider && method.provider !== "N/A" && (
                     <span className="text-sm font-medium"> - {method.provider}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">
                    {formatCurrency(method.amount)}
                  </span>
                  <div
                    className={`flex items-center text-xs ${
                      method.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {method.trend === "up" ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : (
                      <TrendingDown size={14} className="mr-1" />
                    )}
                    {method.percentageChange.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${details.color}-400`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>

      {globalMethods.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Tidak ada data metode pembayaran
        </div>
      )}
    </div>
  );
};

export default PaymentMethodChart;