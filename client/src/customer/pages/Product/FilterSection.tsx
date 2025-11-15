import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { teal } from "@mui/material/colors";
import { colors } from "../../../data/filter/color";
import { useState } from "react";
import { price } from "../../../data/filter/price";
import { discount } from "../../../data/filter/discount";

const FilterSection = () => {
  const [expandColor, setExpandColor] = useState(false);

  const handleExpandColor = () => {
    setExpandColor(!expandColor);
  };
  return (
    <div className="-z-50 space-y-5 bg-white">
      <div className="flex items-center justify-between h-[40px] px-9 lg:border-r">
        <p className="text-lg font-semibold">Filters</p>
        <Button className="">clear all</Button>
      </div>
      <Divider />

      <div className="px-9 !space-y-6 mt-5">
        {/* Color Filter */}
        <section>
          <FormControl sx={{ zIndex: 0 }}>
            <FormLabel
              sx={{ fontSize: "16px", fontWeight: "bold", color: teal[600] }}
            >
              Color
            </FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={colors[0]?.name || ""}
              name="radio-buttons-group"
            >
              {colors
                .slice(0, expandColor ? colors.length : 5)
                .map((color: any) => (
                  <FormControlLabel
                    key={color.name}
                    value={color.name}
                    control={<Radio />}
                    label={color.name}
                  />
                ))}
            </RadioGroup>
          </FormControl>
          <div>
            <Button onClick={handleExpandColor}>
              {expandColor ? "Show Less" : `+ ${colors.length - 5} More`}
            </Button>
          </div>
        </section>

        <Divider />

        {/* Price Filter */}
        <section>
          <FormControl sx={{ zIndex: 0 }}>
            <FormLabel
              sx={{ fontSize: "16px", fontWeight: "bold", color: teal[600] }}
            >
              Price
            </FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={price[0]?.name || ""}
              name="radio-buttons-group"
              className="whitespace-nowrap"
            >
              {price.map((priceRange: any) => (
                <FormControlLabel
                  key={priceRange.value}
                  value={priceRange.name}
                  control={<Radio />}
                  label={priceRange.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>

        <Divider />

        {/* Discount Filter */}
        <section>
          <FormControl sx={{ zIndex: 0 }}>
            <FormLabel
              sx={{ fontSize: "16px", fontWeight: "bold", color: teal[600] }}
            >
              Discount
            </FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={discount[0]?.value || ""}
              name="radio-buttons-group"
              className="whitespace-nowrap"
            >
              {discount.map((discountRange: any) => (
                <FormControlLabel
                  key={discountRange.value}
                  value={discountRange.value}
                  control={<Radio />}
                  label={discountRange.name}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </section>
      </div>
    </div>
  );
};

export default FilterSection;
