import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import Pagination from "./Pagination";

const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "Tidak ada data",
  onRowClick = null,
  className = "",
  tableClassName = "",
  pagination = {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
  onPageChange = null,
  usePagination = true,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="mt-2 text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="overflow-x-auto">
        <table
          className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}
        >
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.cell ? column.cell(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usePagination && pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 pb-6 mt-4">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              <span className="font-medium text-gray-700">
                {pagination.totalItems}
              </span>{" "}
              items total
            </div>

            <div className="order-1 sm:order-2 w-full sm:w-auto overflow-x-auto py-1">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                onPageChange={onPageChange}
                align="center"
              />
            </div>

            <div className="text-sm text-gray-500 order-3 sm:order-3">
              Halaman{" "}
              <span className="font-medium text-indigo-600">
                {pagination.currentPage}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-gray-700">
                {pagination.totalPages}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
