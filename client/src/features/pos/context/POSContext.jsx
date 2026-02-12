import React, { createContext, useContext, useReducer, useCallback } from "react";
import { useAuth } from "../../../features/auth/hooks/useAuth.js";

// Initial state
const initialState = {
  // Branch
  selectedBranch: null,
  
  // Customer
  selectedCustomer: null,
  
  // Cart & Products
  saleMode: "retail", // 'retail' or 'wholesale'
  discount: 0,
  discountType: "percentage", // 'percentage' or 'fixed'
  
  // UI State
  showCustomerSearch: false,
  showBranchSelector: false,
  showPaymentModal: false,
  showReceiptModal: false,
  showKeyboardHelp: false,
  
  // Receipt Data
  receiptData: null,
  
  // Search State
  searchHistory: [],
  
  // Payment State
  paymentAmount: 0,
};

// Action types
const ActionTypes = {
  SET_BRANCH: "SET_BRANCH",
  SET_CUSTOMER: "SET_CUSTOMER",
  SET_SALE_MODE: "SET_SALE_MODE",
  SET_DISCOUNT: "SET_DISCOUNT",
  SET_DISCOUNT_TYPE: "SET_DISCOUNT_TYPE",
  TOGGLE_CUSTOMER_SEARCH: "TOGGLE_CUSTOMER_SEARCH",
  TOGGLE_BRANCH_SELECTOR: "TOGGLE_BRANCH_SELECTOR",
  TOGGLE_PAYMENT_MODAL: "TOGGLE_PAYMENT_MODAL",
  TOGGLE_RECEIPT_MODAL: "TOGGLE_RECEIPT_MODAL",
  TOGGLE_KEYBOARD_HELP: "TOGGLE_KEYBOARD_HELP",
  SET_RECEIPT_DATA: "SET_RECEIPT_DATA",
  SET_SEARCH_HISTORY: "SET_SEARCH_HISTORY",
  ADD_TO_SEARCH_HISTORY: "ADD_TO_SEARCH_HISTORY",
  CLEAR_SEARCH_HISTORY: "CLEAR_SEARCH_HISTORY",
  SET_PAYMENT_AMOUNT: "SET_PAYMENT_AMOUNT",
  RESET_STATE: "RESET_STATE",
};

// Reducer
function posReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_BRANCH:
      return { ...state, selectedBranch: action.payload };
    
    case ActionTypes.SET_CUSTOMER:
      return { ...state, selectedCustomer: action.payload };
    
    case ActionTypes.SET_SALE_MODE:
      return { ...state, saleMode: action.payload };
    
    case ActionTypes.SET_DISCOUNT:
      return { ...state, discount: action.payload };
    
    case ActionTypes.SET_DISCOUNT_TYPE:
      return { ...state, discountType: action.payload };
    
    case ActionTypes.TOGGLE_CUSTOMER_SEARCH:
      return { ...state, showCustomerSearch: action.payload ?? !state.showCustomerSearch };
    
    case ActionTypes.TOGGLE_BRANCH_SELECTOR:
      return { ...state, showBranchSelector: action.payload ?? !state.showBranchSelector };
    
    case ActionTypes.TOGGLE_PAYMENT_MODAL:
      return { ...state, showPaymentModal: action.payload ?? !state.showPaymentModal };
    
    case ActionTypes.TOGGLE_RECEIPT_MODAL:
      return { ...state, showReceiptModal: action.payload ?? !state.showReceiptModal };
    
    case ActionTypes.TOGGLE_KEYBOARD_HELP:
      return { ...state, showKeyboardHelp: action.payload ?? !state.showKeyboardHelp };
    
    case ActionTypes.SET_RECEIPT_DATA:
      return { ...state, receiptData: action.payload };
    
    case ActionTypes.SET_SEARCH_HISTORY:
      return { ...state, searchHistory: action.payload || [] };
    
    case ActionTypes.ADD_TO_SEARCH_HISTORY:
      const newHistory = [action.payload, ...state.searchHistory.filter(item => item !== action.payload)].slice(0, 10);
      localStorage.setItem("posSearchHistory", JSON.stringify(newHistory));
      return { ...state, searchHistory: newHistory };
    
    case ActionTypes.CLEAR_SEARCH_HISTORY:
      localStorage.removeItem("posSearchHistory");
      return { ...state, searchHistory: [] };
    
    case ActionTypes.SET_PAYMENT_AMOUNT:
      return { ...state, paymentAmount: action.payload };
    
    case ActionTypes.RESET_STATE:
      return {
        ...initialState,
        selectedBranch: state.selectedBranch,
        searchHistory: state.searchHistory,
      };
    
    default:
      return state;
  }
}

// Create context
const POSContext = createContext(null);

// Provider component
export const POSProvider = ({ children }) => {
  const [state, dispatch] = useReducer(posReducer, initialState);
  const { user } = useAuth();

  // Load search history from localStorage on mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem("posSearchHistory");
    if (savedHistory) {
      try {
        dispatch({
          type: ActionTypes.SET_SEARCH_HISTORY,
          payload: JSON.parse(savedHistory),
        });
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    }
  }, []);

  // Action creators
  const actions = {
    setSelectedBranch: useCallback((branch) => {
      dispatch({ type: ActionTypes.SET_BRANCH, payload: branch });
    }, []),

    setSelectedCustomer: useCallback((customer) => {
      dispatch({ type: ActionTypes.SET_CUSTOMER, payload: customer });
    }, []),

    setSaleMode: useCallback((mode) => {
      dispatch({ type: ActionTypes.SET_SALE_MODE, payload: mode });
    }, []),

    setDiscount: useCallback((amount) => {
      dispatch({ type: ActionTypes.SET_DISCOUNT, payload: amount });
    }, []),

    setDiscountType: useCallback((type) => {
      dispatch({ type: ActionTypes.SET_DISCOUNT_TYPE, payload: type });
    }, []),

    setShowCustomerSearch: useCallback((show) => {
      dispatch({ type: ActionTypes.TOGGLE_CUSTOMER_SEARCH, payload: show });
    }, []),

    setShowBranchSelector: useCallback((show) => {
      dispatch({ type: ActionTypes.TOGGLE_BRANCH_SELECTOR, payload: show });
    }, []),

    setShowPaymentModal: useCallback((show) => {
      dispatch({ type: ActionTypes.TOGGLE_PAYMENT_MODAL, payload: show });
    }, []),

    setShowReceiptModal: useCallback((show) => {
      dispatch({ type: ActionTypes.TOGGLE_RECEIPT_MODAL, payload: show });
    }, []),

    setShowKeyboardHelp: useCallback((show) => {
      dispatch({ type: ActionTypes.TOGGLE_KEYBOARD_HELP, payload: show });
    }, []),

    setReceiptData: useCallback((data) => {
      dispatch({ type: ActionTypes.SET_RECEIPT_DATA, payload: data });
    }, []),

    addToSearchHistory: useCallback((query) => {
      if (query.trim()) {
        dispatch({ type: ActionTypes.ADD_TO_SEARCH_HISTORY, payload: query.trim() });
      }
    }, []),

    clearSearchHistory: useCallback(() => {
      dispatch({ type: ActionTypes.CLEAR_SEARCH_HISTORY });
    }, []),

    setPaymentAmount: useCallback((amount) => {
      dispatch({ type: ActionTypes.SET_PAYMENT_AMOUNT, payload: amount });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: ActionTypes.RESET_STATE });
    }, []),
  };

  const value = {
    ...state,
    user,
    actions,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};

// Custom hook to use the context
export const usePOSContext = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOSContext must be used within a POSProvider");
  }
  return context;
};

export default POSContext;