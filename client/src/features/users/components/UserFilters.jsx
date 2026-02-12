import React from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { Input } from "@common/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@common/components/ui/select";
import { Button } from "@common/components/ui/button";

const UserFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  roleFilter, 
  setRoleFilter, 
  statusFilter, 
  setStatusFilter, 
  cabangFilter,
  setCabangFilter,
  availableCabang = [],
  itemsPerPage, 
  handleItemsPerPageChange,
  roleList,
  showDashboard,
  toggleDashboard
}) => {
  return (
    <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4 bg-white rounded-t-lg">
      <div className="relative flex-1 min-w-[240px] max-w-sm">
        <FiSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          placeholder="Cari user..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Cabang Filter - Only show if multiple branches available */}
        {availableCabang.length > 1 && (
          <div className="flex items-center gap-2">
            <HiOutlineOfficeBuilding className="text-gray-400" size={18} />
            <Select
              value={cabangFilter}
              onValueChange={setCabangFilter}
              className="w-44"
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {availableCabang.map((cabang) => (
                  <SelectItem key={cabang.id} value={cabang.id}>
                    {cabang.namaCabang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" size={18} />
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            className="w-40"
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {roleList.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.namaRole.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-36"
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Show:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(val) => handleItemsPerPageChange({ target: { value: val } })}
            className="w-20"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!showDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDashboard}
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
          >
            Tampilkan Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserFilters;
