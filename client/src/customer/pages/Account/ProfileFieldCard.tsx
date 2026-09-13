import { Divider } from "@mui/material";

const ProfileFieldCard = ({ keys, value }: any) => {
  return (
    <div className="flex items-center p-5 bg-card text-card-foreground border border-border rounded-xl">
      <p className="w-20 lg:w-36 pr-5 text-muted-foreground font-medium text-sm">{keys}</p>
      <Divider orientation="vertical" flexItem />
      <p className="pl-4 lg:pl-10 font-semibold lg:text-lg text-foreground">{value}</p>
    </div>
  );
};

export default ProfileFieldCard;
