import { Radio } from "@mui/material";

const AddressCard = ({ value, selectedValue, handleChange, item }: any) => {
  return (
    <div className="flex p-5 border border-gray-300 rounded-md">
      <div>
        <Radio
          checked={value == selectedValue}
          onChange={handleChange}
          value={value}
          name="radio-buttons"
        />
      </div>
      <div className="space-y-3 pt-3">
        <h1>{"Anand Kumar"}</h1>
        <p>
          {
            "centurian park terrace home, sector techzone 4 sector 52, greater noida 201310, India"
          }
        </p>
        <p>
          <strong>Mobile:</strong> {"9876543210"}
        </p>
      </div>
    </div>
  );
};

export default AddressCard;
