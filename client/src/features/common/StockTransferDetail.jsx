import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  Building,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  Send,
  CheckSquare,
  XSquare,
  Edit,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import stockTransferService from "../../services/stockTransferService";
import Spinner from "./Spinner";
import ConfirmationDialog from "./ConfirmationDialog";

const StockTransferDetail = ({
  transfer,
  isLoading,
  onRefresh,
  currentUser,
  userRole,
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    show: false,
    action: null,
    title: "",
    message: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  if (isLoading || !transfer) {
    return <Spinner />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Draft
        </span>
      ),
      pending_approval: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Approval
        </span>
      ),
      approved: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Approved
        </span>
      ),
      rejected: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      ),
      dikirim: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Sent
        </span>
      ),
      diterima: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Received
        </span>
      ),
      dibatalkan: (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>
      ),
    };

    return (
      badges[status] || (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      )
    );
  };

  const getStatusTimeline = () => {
    const timelineItems = [
      {
        status: "draft",
        label: "Created",
        description: "Transfer created as draft",
        icon: <FileText className="h-5 w-5" />,
        date: transfer.createdAt,
        completed: true,
      },
      {
        status: "pending_approval",
        label: "Pending Approval",
        description: "Waiting for approval",
        icon: <Clock className="h-5 w-5" />,
        date: transfer.status === "draft" ? null : transfer.updatedAt,
        completed: [
          "pending_approval",
          "approved",
          "rejected",
          "dikirim",
          "diterima",
        ].includes(transfer.status),
      },
      {
        status: "approved",
        label: "Approved",
        description: transfer.approvedById
          ? `Approved by ${transfer.approvedBy?.namaLengkap || "admin"}`
          : "Approved by admin",
        icon: <CheckCircle className="h-5 w-5" />,
        date: transfer.approvedAt,
        completed: ["approved", "dikirim", "diterima"].includes(
          transfer.status
        ),
        skipped: transfer.status === "rejected",
      },
      {
        status: "rejected",
        label: "Rejected",
        description: transfer.alasanReject || "Rejected by admin",
        icon: <XCircle className="h-5 w-5" />,
        date: transfer.approvedAt,
        completed: transfer.status === "rejected",
        skipped: ["approved", "dikirim", "diterima"].includes(transfer.status),
      },
      {
        status: "dikirim",
        label: "Sent",
        description: "Stock has been sent",
        icon: <Send className="h-5 w-5" />,
        date: transfer.tanggalKirim,
        completed: ["dikirim", "diterima"].includes(transfer.status),
        skipped:
          transfer.status === "rejected" || transfer.status === "dibatalkan",
      },
      {
        status: "diterima",
        label: "Received",
        description: "Stock has been received",
        icon: <ArrowLeftRight className="h-5 w-5" />,
        date: transfer.tanggalTerima,
        completed: transfer.status === "diterima",
        skipped:
          transfer.status === "rejected" || transfer.status === "dibatalkan",
      },
    ];

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Transfer Timeline</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {timelineItems
              .filter((item) => !item.skipped)
              .map((item, index, filteredItems) => (
                <li key={item.status}>
                  <div className="relative pb-8">
                    {index !== filteredItems.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      ></span>
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div
                          className={`relative p-1 ${
                            item.completed
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          } rounded-full flex items-center justify-center ring-8 ring-white`}
                        >
                          {item.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span
                              className={`font-medium ${
                                item.completed
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {item.date ? (
                            <span>{formatDate(item.date)}</span>
                          ) : (
                            <span>Not completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  };

  const handleEditTransfer = () => {
    navigate(`/stock-transfers/${transfer.id}/edit`);
  };

  const handleSubmitForApproval = async () => {
    try {
      setProcessingAction(true);
      await stockTransferService.submitForApproval(transfer.id);
      toast.success("Stock transfer submitted for approval");
      onRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to submit for approval");
    } finally {
      setProcessingAction(false);
      closeConfirmationDialog();
    }
  };

  const handleApproveTransfer = async () => {
    try {
      setProcessingAction(true);
      await stockTransferService.approveStockTransfer(transfer.id);
      toast.success("Stock transfer approved successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to approve transfer");
    } finally {
      setProcessingAction(false);
      closeConfirmationDialog();
    }
  };

  const handleRejectTransfer = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setProcessingAction(true);
      await stockTransferService.rejectStockTransfer(transfer.id, {
        alasanReject: rejectReason,
      });
      toast.success("Stock transfer rejected");
      setRejectReason("");
      onRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to reject transfer");
    } finally {
      setProcessingAction(false);
      closeConfirmationDialog();
    }
  };

  const handleSendTransfer = async () => {
    try {
      setProcessingAction(true);
      await stockTransferService.sendStockTransfer(transfer.id, {
        tanggalKirim: new Date().toISOString(),
      });
      toast.success("Stock transfer sent successfully");
      onRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to send transfer");
    } finally {
      setProcessingAction(false);
      closeConfirmationDialog();
    }
  };

  const handleReceiveTransfer = () => {
    navigate(`/stock-transfers/${transfer.id}/receive`);
  };

  const handleCancelTransfer = async () => {
    try {
      setProcessingAction(true);
      await stockTransferService.cancelStockTransfer(transfer.id, {
        alasanBatal: "Cancelled by user",
      });
      toast.success("Stock transfer cancelled");
      onRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to cancel transfer");
    } finally {
      setProcessingAction(false);
      closeConfirmationDialog();
    }
  };

  const showConfirmDialog = (action, title, message) => {
    setConfirmationDialog({
      show: true,
      action,
      title,
      message,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      show: false,
      action: null,
      title: "",
      message: "",
    });
  };

  // Determine available actions based on transfer status and user role
  const getAvailableActions = () => {
    const isSuperAdmin = userRole === "super_admin";
    const isAdminCabang = userRole === "admin_cabang";

    // Check if user is from origin or destination branch
    const isFromOriginBranch = currentUser?.cabangId === transfer.cabangAsalId;
    const isFromDestinationBranch =
      currentUser?.cabangId === transfer.cabangTujuanId;

    const actions = [];

    if (transfer.status === "draft") {
      if (isAdminCabang && isFromOriginBranch) {
        actions.push(
          <button
            key="edit"
            onClick={handleEditTransfer}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            disabled={processingAction}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </button>
        );

        actions.push(
          <button
            key="submit"
            onClick={() =>
              showConfirmDialog(
                "submit",
                "Submit for Approval",
                "Are you sure you want to submit this transfer for approval? You won't be able to edit it after submission."
              )
            }
            className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
            disabled={processingAction}
          >
            <ArrowRight className="h-4 w-4 mr-1" /> Submit for Approval
          </button>
        );

        actions.push(
          <button
            key="cancel"
            onClick={() =>
              showConfirmDialog(
                "cancel",
                "Cancel Transfer",
                "Are you sure you want to cancel this transfer?"
              )
            }
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            disabled={processingAction}
          >
            <XCircle className="h-4 w-4 mr-1" /> Cancel
          </button>
        );
      }
    } else if (transfer.status === "pending_approval") {
      if (isSuperAdmin) {
        actions.push(
          <button
            key="approve"
            onClick={() =>
              showConfirmDialog(
                "approve",
                "Approve Transfer",
                "Are you sure you want to approve this transfer?"
              )
            }
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            disabled={processingAction}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Approve
          </button>
        );

        actions.push(
          <button
            key="reject"
            onClick={() =>
              showConfirmDialog(
                "reject",
                "Reject Transfer",
                "Please provide a reason for rejecting this transfer."
              )
            }
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            disabled={processingAction}
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </button>
        );
      }
    } else if (transfer.status === "approved") {
      if (isAdminCabang && isFromOriginBranch) {
        actions.push(
          <button
            key="send"
            onClick={() =>
              showConfirmDialog(
                "send",
                "Send Transfer",
                "Are you sure you want to send this transfer? This will reduce stock from your branch."
              )
            }
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={processingAction}
          >
            <Send className="h-4 w-4 mr-1" /> Send Transfer
          </button>
        );
      }
    } else if (transfer.status === "dikirim") {
      if (isAdminCabang && isFromDestinationBranch) {
        actions.push(
          <button
            key="receive"
            onClick={handleReceiveTransfer}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            disabled={processingAction}
          >
            <CheckSquare className="h-4 w-4 mr-1" /> Receive Transfer
          </button>
        );
      }
    }

    return actions;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Transfer {transfer.nomorTransfer}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Created: {formatDate(transfer.createdAt)}</span>
            <span className="mx-2">•</span>
            <span>Status: {getStatusBadge(transfer.status)}</span>
          </div>
        </div>

        <div className="flex space-x-2 mt-2 sm:mt-0">
          {getAvailableActions()}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Transfer information */}
        <div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3 flex items-center">
              <ArrowLeftRight className="h-5 w-5 mr-2 text-gray-500" />
              Transfer Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <Building className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Origin Branch</p>
                  <p className="text-gray-700">
                    {transfer.cabangAsal.namaCabang}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Building className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Destination Branch</p>
                  <p className="text-gray-700">
                    {transfer.cabangTujuan.namaCabang}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-gray-700">
                    {transfer.createdByUser?.namaLengkap || "-"}
                  </p>
                </div>
              </div>

              {transfer.approvedById && (
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p className="text-gray-700">
                      {transfer.approvedBy?.namaLengkap || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transfer.approvedAt)}
                    </p>
                  </div>
                </div>
              )}

              {transfer.status === "rejected" && transfer.alasanReject && (
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-500">
                      Rejection Reason
                    </p>
                    <p className="text-gray-700">{transfer.alasanReject}</p>
                  </div>
                </div>
              )}

              {transfer.keterangan && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-gray-700">{transfer.keterangan}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {getStatusTimeline()}
        </div>

        {/* Right column - Products */}
        <div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <h3 className="font-medium flex items-center">
                <Package className="h-5 w-5 mr-2 text-gray-500" />
                Products ({transfer.transferDetails.length})
              </h3>
              <button className="text-gray-500">
                {showDetails ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {showDetails && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent Qty
                        </th>
                        {transfer.status === "diterima" && (
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Received Qty
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transfer.transferDetails.map((detail) => (
                        <tr key={detail.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {detail.produk.produkMaster?.namaProduk ||
                                detail.produk.namaProduk}
                            </div>
                            <div className="text-xs text-gray-500">
                              {detail.produk.sku}
                            </div>
                            {detail.keterangan && (
                              <div className="text-xs text-gray-500 mt-1">
                                Note: {detail.keterangan}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {detail.jumlahKirim}
                            </div>
                          </td>
                          {transfer.status === "diterima" && (
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div
                                className={`text-sm ${
                                  detail.jumlahTerima < detail.jumlahKirim
                                    ? "text-red-600 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                {detail.jumlahTerima}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Standard Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={
          confirmationDialog.show && confirmationDialog.action !== "reject"
        }
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={
          confirmationDialog.action === "approve"
            ? "Approve"
            : confirmationDialog.action === "cancel"
            ? "Cancel Transfer"
            : confirmationDialog.action === "submit"
            ? "Submit"
            : "Send"
        }
        confirmButtonColor={
          confirmationDialog.action === "approve"
            ? "green"
            : confirmationDialog.action === "cancel"
            ? "red"
            : confirmationDialog.action === "submit"
            ? "yellow"
            : "blue"
        }
        cancelText="No, go back"
        onConfirm={() => {
          if (confirmationDialog.action === "approve") {
            handleApproveTransfer();
          } else if (confirmationDialog.action === "cancel") {
            handleCancelTransfer();
          } else if (confirmationDialog.action === "submit") {
            handleSubmitForApproval();
          } else if (confirmationDialog.action === "send") {
            handleSendTransfer();
          }
        }}
        onCancel={closeConfirmationDialog}
      />

      {/* Reject Dialog with textarea */}
      {confirmationDialog.show && confirmationDialog.action === "reject" && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Stock Transfer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please provide a reason for rejecting stock transfer{" "}
                        <span className="font-medium">
                          {transfer.nomorTransfer}
                        </span>
                        .
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="rejectReason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Rejection Reason*
                        </label>
                        <textarea
                          id="rejectReason"
                          name="rejectReason"
                          rows="3"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="mt-1 shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter reason for rejection"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectTransfer}
                  disabled={processingAction}
                >
                  {processingAction ? "Processing..." : "Reject"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeConfirmationDialog}
                  disabled={processingAction}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferDetail;
