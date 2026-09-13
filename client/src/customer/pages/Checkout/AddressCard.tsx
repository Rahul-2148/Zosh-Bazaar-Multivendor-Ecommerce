import { Radio } from "@mui/material";

const AddressCard = ({ value, selectedValue, handleChange }: any) => {
  return (
    <div className="flex p-5 border border-border bg-card text-card-foreground rounded-xl shadow-sm">
      <div>
        <Radio
          checked={value == selectedValue}
          onChange={handleChange}
          value={value}
          name="radio-buttons"
        />
      </div>
      <div className="space-y-2 pt-1 pl-2">
        <h1 className="font-semibold text-foreground text-sm">{"Anand Kumar"}</h1>
        <p className="text-xs text-muted-foreground">
          {
            "centurian park terrace home, sector techzone 4 sector 52, greater noida 201310, India"
          }
        </p>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Mobile:</strong> {"9876543210"}
        </p>
      </div>
    </div>
  );
};

export default AddressCard;
