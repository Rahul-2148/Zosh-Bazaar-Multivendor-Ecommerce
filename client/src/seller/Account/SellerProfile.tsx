import { Edit } from "@mui/icons-material";
import { Avatar, Button, Divider, Paper, Chip } from "@mui/material";
import ProfileFieldCard from "../../customer/pages/Account/ProfileFieldCard";
import { useAppSelector } from "../../Redux Toolkit/Store";

const SellerProfile = () => {
  const { seller } = useAppSelector((store) => store);

  const statusProps = getStatusProps(seller.profile?.accountStatus);

  return (
    <div className="lg:px-20 pt-8 pb-20 space-y-12">
      {/* Seller Header Section */}
      <Paper
        elevation={3}
        className="p-8 rounded-2xl w-full max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8"
      >
        {/* Avatar */}
        <Avatar
          sx={{ width: "8rem", height: "8rem" }}
          src="https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200"
        />

        {/* Info */}
        <div className="flex-1 w-full space-y-4">
          {/* Role + Account Status Chips */}
          <div className="flex gap-3">
            <Chip
              label={seller.profile?.role || "Seller"}
              color="primary"
              size="small"
              variant="outlined"
            />
            <Chip
              label={statusProps.label}
              color={statusProps.color}
              size="small"
              variant="outlined"
            />
          </div>

          {/* Seller Name + Email + Mobile */}
          <div className="space-y-3">
            <ProfileFieldCard
              keys={"Seller Name"}
              value={seller.profile?.sellerName}
            />
            <Divider />
            <ProfileFieldCard keys={"Email"} value={seller.profile?.email} />
            <Divider />
            <ProfileFieldCard keys={"Mobile"} value={seller.profile?.mobile} />
          </div>
        </div>

        <Button className="w-12 h-12 self-start">
          <Edit />
        </Button>
      </Paper>

      {/* Business Details */}
      <Paper elevation={3} className="p-6 rounded-2xl w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-semibold">Business Details</h1>
          <Button className="w-12 h-12">
            <Edit />
          </Button>
        </div>
        <Divider />

        <div className="space-y-3 pt-6">
          <ProfileFieldCard
            keys={"Business Name / Brand Name"}
            value={seller.profile?.businessDetails?.businessName}
          />
          <Divider />
          <ProfileFieldCard keys={"GSTIN"} value={seller.profile?.GSTIN} />
        </div>
      </Paper>

      {/* Pickup Address */}
      <Paper elevation={3} className="p-6 rounded-2xl w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-semibold">Pickup Address</h1>
          <Button className="w-12 h-12">
            <Edit />
          </Button>
        </div>
        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="md:col-span-2">
            <ProfileFieldCard
              keys={"Address"}
              value={seller.profile?.pickupAddress?.address}
            />
          </div>

          <ProfileFieldCard
            keys={"Locality"}
            value={seller.profile?.pickupAddress?.locality}
          />
          <ProfileFieldCard
            keys={"City"}
            value={seller.profile?.pickupAddress?.city}
          />
          <ProfileFieldCard
            keys={"State"}
            value={seller.profile?.pickupAddress?.state}
          />
          <ProfileFieldCard
            keys={"Pincode"}
            value={seller.profile?.pickupAddress?.pincode}
          />
          <ProfileFieldCard
            keys={"Mobile"}
            value={seller.profile?.pickupAddress?.mobile}
          />
          <ProfileFieldCard
            keys={"Country"}
            value={seller.profile?.pickupAddress?.country}
          />
          <ProfileFieldCard
            keys={"Name"}
            value={seller.profile?.pickupAddress?.name}
          />
          <ProfileFieldCard
            keys={"Email"}
            value={seller.profile?.pickupAddress?.email}
          />
        </div>
      </Paper>
    </div>
  );
};

export default SellerProfile;

// Account status helper
const getStatusProps = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", color: "success" as const };
    case "PENDING_VERIFICATION":
      return { label: "Pending Verification", color: "warning" as const };
    case "SUSPENDED":
      return { label: "Suspended", color: "error" as const };
    case "DEACTIVATED":
      return { label: "Deactivated", color: "info" as const };
    case "BANNED":
      return { label: "Banned", color: "secondary" as const };
    case "CLOSED":
      return { label: "Closed", color: "default" as const };
    default:
      return { label: "Unknown", color: "default" as const };
  }
};
