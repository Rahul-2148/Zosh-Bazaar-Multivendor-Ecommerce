import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShareOutlined,
  EditOutlined,
  Add,
  CloudSyncOutlined,
  SelectAll,
} from "@mui/icons-material";
import { Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  getWishlist,
  deleteCollection,
  bulkDeleteItems,
  syncGuestWishlist,
} from "../../../Redux Toolkit/features/customer/WishlistSlice";
import { addItemToCart, fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { useSnackbar } from "../../../common/SnackbarProvider";
import {
  getGuestSavedItems,
  clearGuestSavedItems,
} from "../../../utils/guestWishlist";
import type {
  ICollection,
  AvailabilityFilter,
  SortFilter,
} from "../../../types/wishlistTypes";

// Components
import CollectionSidebar from "./components/CollectionSidebar";
import SavedItemCard from "./components/SavedItemCard";
import WishlistFilters from "./components/WishlistFilters";
import BulkActionBar from "./components/BulkActionBar";
import CreateCollectionModal from "./components/CreateCollectionModal";
import ShareCollectionModal from "./components/ShareCollectionModal";
import MoveItemsModal from "./components/MoveItemsModal";
import WishlistEmptyState from "./components/WishlistEmptyState";
import WishlistSkeleton from "./components/WishlistSkeleton";

export const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    items,
    collections,
    activeCollection,
    loading,
    totalSavedCount,
  } = useAppSelector((store) => store.wishlist);

  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  // Local filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortFilter>("recently_added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection for bulk actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<ICollection | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [collectionToShare, setCollectionToShare] = useState<ICollection | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<string[]>([]);

  // Guest items state if unauthenticated
  const [guestItems, setGuestItems] = useState<any[]>(() => (!jwt ? getGuestSavedItems() : []));

  // 1. Initial Load & Guest Sync
  useEffect(() => {
    if (jwt) {
      // Check if there are guest items in localStorage to merge
      const localGuests = getGuestSavedItems();
      if (localGuests.length > 0) {
        dispatch(syncGuestWishlist(localGuests))
          .unwrap()
          .then(() => {
            clearGuestSavedItems();
            showSnackbar("Merged guest saved items into your account!", "success");
          })
          .catch(() => {});
      }

      const colParam = searchParams.get("collection");
      dispatch(
        getWishlist({
          collectionId: colParam || undefined,
        })
      );
    } else {
      // Guest mode
      const handleGuestUpdate = () => setGuestItems(getGuestSavedItems());
      window.addEventListener("guestWishlistUpdated", handleGuestUpdate);
      return () => {
        window.removeEventListener("guestWishlistUpdated", handleGuestUpdate);
      };
    }
  }, [dispatch, jwt, searchParams, showSnackbar]);

  // Handle active collection changes
  const handleSelectCollection = (col: ICollection | null) => {
    setSelectedItemIds([]);
    if (col) {
      setSearchParams({ collection: col._id });
      dispatch(
        getWishlist({
          collectionId: col._id,
          availability,
          sort,
          search: searchQuery,
        })
      );
    } else {
      setSearchParams({});
      dispatch(
        getWishlist({
          availability,
          sort,
          search: searchQuery,
        })
      );
    }
  };

  // Filter and sort handlers
  const handleAvailabilityChange = (val: AvailabilityFilter) => {
    setAvailability(val);
    if (jwt) {
      dispatch(
        getWishlist({
          collectionId: activeCollection?._id,
          availability: val,
          sort,
          search: searchQuery,
        })
      );
    }
  };

  const handleSortChange = (val: SortFilter) => {
    setSort(val);
    if (jwt) {
      dispatch(
        getWishlist({
          collectionId: activeCollection?._id,
          availability,
          sort: val,
          search: searchQuery,
        })
      );
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (jwt) {
      dispatch(
        getWishlist({
          collectionId: activeCollection?._id,
          availability,
          sort,
          search: val,
        })
      );
    }
  };

  // Selection handlers
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((i) => i._id));
    }
  };

  // Bulk operations
  const handleBulkAddToCart = async () => {
    if (!jwt) return;
    setBulkLoading(true);
    let addedCount = 0;

    for (const id of selectedItemIds) {
      const item = items.find((i) => i._id === id);
      if (item && item.smartState.isAvailable) {
        try {
          await dispatch(
            addItemToCart({
              jwt,
              productId: item.product._id,
              quantity: 1,
            })
          ).unwrap();
          addedCount++;
        } catch {
          // ignore individual add failure
        }
      }
    }

    dispatch(fetchUserCart(jwt));
    showSnackbar(`Added ${addedCount} available item(s) to your bag`, "success");
    setSelectedItemIds([]);
    setBulkLoading(false);
  };

  const handleBulkMove = () => {
    setItemsToMove(selectedItemIds);
    setMoveModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (!jwt) return;
    setBulkLoading(true);
    try {
      await dispatch(bulkDeleteItems(selectedItemIds)).unwrap();
      showSnackbar(`Removed ${selectedItemIds.length} items`, "info");
      setSelectedItemIds([]);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to delete items", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteCurrentCollection = async (col: ICollection) => {
    if (col.isSystem) {
      showSnackbar("System collections cannot be deleted", "error");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete "${col.name}"? Products will be preserved in your Favorites.`
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteCollection({ id: col._id, moveItemsToFavorites: true })).unwrap();
      showSnackbar(`Collection "${col.name}" deleted`, "info");
      handleSelectCollection(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to delete collection", "error");
    }
  };

  // Guest Mode View
  if (!jwt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 min-h-[70vh]">
        {/* Guest Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CloudSyncOutlined className="text-amber-600 dark:text-amber-400" sx={{ fontSize: 24 }} />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Browsing Saved Items on this Device
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Sign in to sync your saved items, create custom collections, and get price-drop alerts.
              </p>
            </div>
          </div>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/login?returnTo=/wishlist")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "0.75rem",
              px: 2.5,
              whiteSpace: "nowrap",
            }}
          >
            Sign In to Sync
          </Button>
        </div>

        {guestItems.length === 0 ? (
          <WishlistEmptyState type="wishlist" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                Saved Items ({guestItems.length})
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {guestItems.map((gItem) => {
                const prod = gItem.product || {};
                return (
                  <div
                    key={gItem.productId}
                    className="p-4 rounded-2xl border border-border bg-card flex flex-col gap-3 justify-between"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="w-full aspect-square rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                        <img
                          src={prod.images?.[0] || "https://via.placeholder.com/200"}
                          alt={prod.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2">
                        {prod.title || "Saved Product"}
                      </h4>
                      <p className="text-sm font-extrabold text-foreground">
                        ₹{prod.sellingPrice?.toLocaleString("en-IN") || "—"}
                      </p>
                    </div>

                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/login?returnTo=/wishlist`)}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
                    >
                      Sign In to Buy
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Collection Metadata
  const currentCollection =
    activeCollection || collections.find((c) => c.isDefault) || collections[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 min-h-screen">
      {/* Mobile Horizontal Collections Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-border/60">
        {collections.map((col) => {
          const isActive = currentCollection?._id === col._id;
          return (
            <button
              key={col._id}
              type="button"
              onClick={() => handleSelectCollection(col)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card text-foreground border border-border/70 hover:bg-muted"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: col.color || "#0d9488" }}
              />
              <span>{col.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {col.itemCount ?? 0}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border border-dashed border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <Add sx={{ fontSize: 15 }} />
          <span>New List</span>
        </button>
      </div>

      <div className="flex items-start gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block sticky top-24">
          <CollectionSidebar
            collections={collections}
            activeCollectionId={currentCollection?._id || ""}
            totalSavedCount={totalSavedCount}
            onSelectCollection={handleSelectCollection}
            onOpenCreateModal={() => {
              setCollectionToEdit(null);
              setCreateModalOpen(true);
            }}
            onOpenEditModal={(col) => {
              setCollectionToEdit(col);
              setCreateModalOpen(true);
            }}
            onOpenShareModal={(col) => {
              setCollectionToShare(col);
              setShareModalOpen(true);
            }}
            onDeleteCollection={handleDeleteCurrentCollection}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Collection Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: currentCollection?.color || "#0d9488" }}
                />
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {currentCollection?.name || "Saved Items"}
                </h1>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
              {currentCollection?.description && (
                <p className="text-xs text-muted-foreground pl-6">
                  {currentCollection.description}
                </p>
              )}
            </div>

            {/* Collection Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {items.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAll}
                  startIcon={<SelectAll />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "0.75rem",
                    fontSize: "11px",
                  }}
                >
                  {selectedItemIds.length === items.length ? "Deselect All" : "Select All"}
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setCollectionToShare(currentCollection || null);
                  setShareModalOpen(true);
                }}
                startIcon={<ShareOutlined />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "0.75rem",
                  fontSize: "11px",
                }}
              >
                Share
              </Button>

              {currentCollection && !currentCollection.isSystem && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setCollectionToEdit(currentCollection);
                    setCreateModalOpen(true);
                  }}
                  startIcon={<EditOutlined />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "0.75rem",
                    fontSize: "11px",
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Search, Filter & Sort Toolbar */}
          <WishlistFilters
            search={searchQuery}
            onSearchChange={handleSearchChange}
            availability={availability}
            onAvailabilityChange={handleAvailabilityChange}
            sort={sort}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={items.length}
          />

          {/* Items Section */}
          {loading && items.length === 0 ? (
            <WishlistSkeleton count={8} viewMode={viewMode} />
          ) : items.length === 0 ? (
            searchQuery ? (
              <WishlistEmptyState
                type="search"
                searchQuery={searchQuery}
                onClearFilters={() => {
                  setSearchQuery("");
                  setAvailability("all");
                  dispatch(getWishlist({ collectionId: currentCollection?._id }));
                }}
              />
            ) : availability !== "all" ? (
              <WishlistEmptyState
                type="filter"
                onClearFilters={() => handleAvailabilityChange("all")}
              />
            ) : (
              <WishlistEmptyState
                type={currentCollection?.isDefault ? "wishlist" : "collection"}
                collectionName={currentCollection?.name}
              />
            )
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                  : "space-y-3"
              }
            >
              {items.map((item) => (
                <SavedItemCard
                  key={item._id}
                  item={item}
                  isSelected={selectedItemIds.includes(item._id)}
                  onToggleSelect={handleToggleSelect}
                  onOpenMoveModal={(it) => {
                    setItemsToMove([it._id]);
                    setMoveModalOpen(true);
                  }}
                  onOpenShareModal={(prod) => {
                    if (navigator.share) {
                      navigator.share({
                        title: prod.title,
                        url: window.location.origin + `/product-details/all/${encodeURIComponent(prod.title || "")}/${prod._id}`,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(
                        window.location.origin + `/product-details/all/${encodeURIComponent(prod.title || "")}/${prod._id}`
                      );
                      showSnackbar("Product link copied to clipboard!", "success");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Sticky Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedItemIds.length}
        onClearSelection={() => setSelectedItemIds([])}
        onBulkAddToCart={handleBulkAddToCart}
        onBulkMove={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        loading={bulkLoading}
      />

      {/* Modals */}
      {createModalOpen && (
        <CreateCollectionModal
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setCollectionToEdit(null);
          }}
          collectionToEdit={collectionToEdit}
        />
      )}

      {shareModalOpen && (
        <ShareCollectionModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setCollectionToShare(null);
          }}
          collection={collectionToShare}
        />
      )}

      {moveModalOpen && (
        <MoveItemsModal
          open={moveModalOpen}
          onClose={() => {
            setMoveModalOpen(false);
            setItemsToMove([]);
          }}
          itemIds={itemsToMove}
          collections={collections}
          currentCollectionId={currentCollection?._id}
          onSuccess={() => setSelectedItemIds([])}
        />
      )}
    </div>
  );
};

export default Wishlist;
