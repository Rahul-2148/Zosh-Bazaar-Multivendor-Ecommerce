import React, { useState } from "react";
import {
  Add,
  Favorite,
  AccessTime,
  FolderSpecial,
  MoreVert,
  ShareOutlined,
  EditOutlined,
  DeleteOutline,
  LockOutlined,
  PublicOutlined,
} from "@mui/icons-material";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import type { ICollection } from "../../../../types/wishlistTypes";

interface CollectionSidebarProps {
  collections: ICollection[];
  activeCollectionId: string;
  totalSavedCount: number;
  onSelectCollection: (collection: ICollection | null) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (col: ICollection) => void;
  onOpenShareModal: (col: ICollection) => void;
  onDeleteCollection: (col: ICollection) => void;
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({
  collections,
  activeCollectionId,
  totalSavedCount,
  onSelectCollection,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenShareModal,
  onDeleteCollection,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCol, setSelectedCol] = useState<ICollection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, col: ICollection) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedCol(col);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedCol(null);
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 shrink-0 space-y-4">
      {/* Header & New Collection Button */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          My Collections
        </h2>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <Add sx={{ fontSize: 16 }} />
          <span>New</span>
        </button>
      </div>

      {/* Quick Search if multiple collections */}
      {collections.length >= 5 && (
        <input
          type="text"
          placeholder="Filter collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
      )}

      {/* Collections List */}
      <div className="space-y-1">
        {filteredCollections.map((col) => {
          const isActive = activeCollectionId === col._id;
          const isFavorites = col.isDefault;
          const isBuyLater = col.slug === "buy-later";

          return (
            <div
              key={col._id}
              onClick={() => onSelectCollection(col)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20 font-bold"
                  : "text-foreground hover:bg-muted/70"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isFavorites ? (
                  <Favorite
                    sx={{
                      fontSize: 16,
                      color: isActive ? "inherit" : "var(--destructive)",
                    }}
                  />
                ) : isBuyLater ? (
                  <AccessTime
                    sx={{
                      fontSize: 16,
                      color: isActive ? "inherit" : "#f59e0b",
                    }}
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: col.color || "#0d9488" }}
                  />
                )}

                <span className="truncate">{col.name}</span>

                {col.visibility === "SHARED" || col.visibility === "PUBLIC" ? (
                  <Tooltip title="Shared collection">
                    <PublicOutlined
                      sx={{
                        fontSize: 12,
                        opacity: 0.7,
                      }}
                    />
                  </Tooltip>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {col.itemCount ?? 0}
                </span>

                {/* More button on hover for custom collections */}
                {!col.isSystem && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, col)}
                    sx={{
                      p: 0.25,
                      color: isActive ? "inherit" : "var(--muted-foreground)",
                      opacity: isActive ? 1 : 0,
                      "&:hover": { opacity: 1 },
                      ".group:hover &": { opacity: 1 },
                    }}
                  >
                    <MoreVert sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "0.85rem",
              minWidth: 160,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedCol) onOpenShareModal(selectedCol);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ShareOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Share List" primaryTypographyProps={{ fontSize: "12px", fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedCol) onOpenEditModal(selectedCol);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit List" primaryTypographyProps={{ fontSize: "12px", fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedCol) onDeleteCollection(selectedCol);
            handleCloseMenu();
          }}
          className="text-destructive"
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" sx={{ color: "var(--destructive)" }} />
          </ListItemIcon>
          <ListItemText
            primary="Delete List"
            primaryTypographyProps={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--destructive)",
            }}
          />
        </MenuItem>
      </Menu>
    </aside>
  );
};

export default CollectionSidebar;
