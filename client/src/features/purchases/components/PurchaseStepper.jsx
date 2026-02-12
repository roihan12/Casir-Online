import React from "react";
import { Check, User, ShoppingCart } from "lucide-react";

/**
 * Stepper component for Purchase Creation
 * @param {object} props
 * @param {number} props.currentStep - 1 (Select Supplier) or 2 (Product Details)
 */
const PurchaseStepper = ({ currentStep = 1 }) => {
  const steps = [
    {
      id: 1,
      title: "Pilih Supplier",
      description: "Tentukan supplier untuk pembelian",
      icon: User,
    },
    {
      id: 2,
      title: "Detail Pembelian",
      description: "Isi form dan pilih produk",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-8">
      <div className="flex items-center w-full max-w-3xl">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="relative flex flex-col items-center group">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 z-10 ${
                    isCompleted
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isCurrent
                      ? "bg-white border-indigo-600 text-indigo-600"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                
                <div className="absolute top-12 flex flex-col items-center w-40">
                  <span
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? "text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-gray-400 text-center hidden sm:block mt-1">
                    {step.description}
                  </span>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-auto h-1 relative mx-4">
                  <div className="absolute top-0 left-0 h-full w-full bg-gray-200 rounded"></div>
                  <div 
                    className={`absolute top-0 left-0 h-full bg-indigo-600 rounded transition-all duration-500 ${
                      isCompleted ? "w-full" : "w-0"
                    }`}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseStepper;
