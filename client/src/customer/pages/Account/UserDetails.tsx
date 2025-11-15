import { useAppSelector } from "../../../Redux Toolkit/Store";
import ProfileFieldCard from "./ProfileFieldCard";

const UserDetails = () => {
  const { user } = useAppSelector((store) => store);

  return (
    <div className="space-y-5">
      <ProfileFieldCard keys="Name" value={user?.user?.fullName} />
      <ProfileFieldCard keys="Email" value={user?.user?.email} />
      <ProfileFieldCard
        keys="Mobile"
        value={user?.user?.mobile ? user?.user?.mobile : "Not provided"}
      />
      <ProfileFieldCard keys="Role" value={user?.user?.role} />
    </div>
  );
};

export default UserDetails;
