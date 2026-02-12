import * as React from "react"
import { cn } from "@common/utils/cn";

// Context untuk mengelola state tab
const TabsContext = React.createContext({
  activeTab: "",
  setActiveTab: () => {},
});

// Komponen utama Tabs
const Tabs = React.forwardRef(({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || "");
  
  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);
  
  const handleTabChange = React.useCallback((newValue) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

// Komponen TabsList
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// Komponen TabsTrigger
const TabsTrigger = React.forwardRef(({ className, value, disabled, ...props }, ref) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

// Komponen TabsContent
const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;
  
  if (!isActive) return null;
  
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }
