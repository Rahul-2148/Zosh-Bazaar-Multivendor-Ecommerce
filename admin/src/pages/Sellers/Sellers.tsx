import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { SellerItem } from "../../types/adminTypes";
import { PageHeader } from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutline,
} from "@mui/icons-material";

const STATUS_TABS = [
  { label: "All Sellers", value: "ALL" },
  { label: "Pending Verification", value: "PENDING_VERIFICATION" },
  { label: "Active", value: "ACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Banned", value: "BANNED" },
];

export const Sellers: React.FC = () => {
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  // Status Change Dialog State
  const [selectedSeller, setSelectedSeller] = useState<SellerItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Delete Seller Dialog State
  const [deleteTarget, setDeleteTarget] = useState<SellerItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
      adminApi
        .getAllSellers(activeTab === "ALL" ? undefined : activeTab)
        .then((data) => {
          if (!ignore) {
            setSellers(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load sellers", err);
          if (!ignore) {
            setSellers([]);
            setLoading(false);
          }
        });
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleOpenStatusModal = (seller: SellerItem) => {
    setSelectedSeller(seller);
    setNewStatus(seller.accountStatus);
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedSeller || !newStatus) return;
    setSavingStatus(true);
    try {
      await adminApi.updateSellerStatus(selectedSeller._id, newStatus);
      setSellers((prev) =>
        prev.map((s) =>
          s._id === selectedSeller._id
            ? { ...s, accountStatus: newStatus as any }
            : s
        )
      );
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteSeller(deleteTarget._id);
      setSellers((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete seller", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors & Sellers"
        subtitle="Review marketplace seller applications, verify credentials, and manage account statuses."
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Fetching vendors..." />
        ) : !Array.isArray(sellers) || sellers.length === 0 ? (
          <EmptyState
            title="No sellers found"
            description="There are no sellers matching this status filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Seller Name / Email</th>
                  <th className="px-6 py-3.5">Mobile</th>
                  <th className="px-6 py-3.5">GSTIN</th>
                  <th className="px-6 py-3.5">Pickup Location</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {(Array.isArray(sellers) ? sellers : []).map((seller) => (
                  <tr key={seller._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {seller.sellerName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">
                            {seller.sellerName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-foreground">
                      {seller.mobile || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {seller.gstin || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {seller.pickupAddress
                        ? `${seller.pickupAddress.city}, ${seller.pickupAddress.state}`
                        : "Not specified"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={seller.accountStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip title="Update Account Status">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenStatusModal(seller)}
                            sx={{ color: "primary.main" }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Account">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteTarget(seller);
                              setDeleteModalOpen(true);
                            }}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Dialog
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1rem", p: 1, bgcolor: "background.paper", color: "text.primary" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Update Vendor Status
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <p className="text-xs text-muted-foreground mb-4">
            Changing status for <strong className="text-foreground">{selectedSeller?.sellerName}</strong> ({selectedSeller?.email})
          </p>
          <FormControl fullWidth size="small">
            <InputLabel id="status-select-label">Account Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Account Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="PENDING_VERIFICATION">Pending Verification</MenuItem>
              <MenuItem value="ACTIVE">Active (Approved)</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="DEACTIVATED">Deactivated</MenuItem>
              <MenuItem value="BANNED">Banned</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setStatusModalOpen(false)}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            color="primary"
            disabled={savingStatus}
            sx={{
              textTransform: "none",
            }}
          >
            {savingStatus ? "Saving..." : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Seller Account"
        message={`Are you sure you want to delete the seller account for "${deleteTarget?.sellerName}"? This action cannot be undone.`}
        confirmLabel="Delete Seller"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
