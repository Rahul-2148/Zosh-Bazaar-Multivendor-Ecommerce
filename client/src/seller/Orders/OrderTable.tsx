import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Button, Chip, Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import { updateOrderStatus } from "../../Redux Toolkit/features/seller/SellerOrderSlice";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const orderStatus = [
  {
    color: "#FFA500",
    label: "PENDING",
  },
  {
    color: "#F5BCBA",
    label: "PLACED",
  },
  {
    color: "#8BC34A",
    label: "CONFIRMED",
  },
  {
    color: "#1E90FF",
    label: "SHIPPED",
  },
  {
    color: "#32CD32",
    label: "DELIVERED",
  },
  {
    color: "#FF0000",
    label: "CANCELLED",
  },
];

const orderStatusColor = {
  PENDING: { color: "#FFA500", label: "PENDING" }, // orange
  PLACED: { color: "#F5BCBA", label: "PLACED" }, // pink
  CONFIRMED: { color: "#8BC34A", label: "CONFIRMED" }, // light green
  SHIPPED: { color: "#1E90FF", label: "SHIPPED" }, // blue
  DELIVERED: { color: "#32CD32", label: "DELIVERED" }, // green
  CANCELLED: { color: "#FF0000", label: "CANCELLED" }, // red
};

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9),
];

export default function OrderTable() {
  const dispatch = useAppDispatch();
  const {orders} = useAppSelector((store) => store.sellerOrder);
  console.log(orders) 
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUpdateOrderStatus = (id: number, status: string) => {
    console.log("update order status", id, status);
    handleClose();

    const data = {
      orderId: id,
      orderStatus: status,
      jwt: localStorage.getItem("jwt")
    }
    dispatch(updateOrderStatus(data as any));
  };
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Order Id</StyledTableCell>
            <StyledTableCell>Products</StyledTableCell>
            <StyledTableCell align="right">Shopping Address</StyledTableCell>
            <StyledTableCell align="right">Order Status</StyledTableCell>
            <StyledTableCell align="right">Update</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <StyledTableRow key={row.name}>
              <StyledTableCell component="th" scope="row">
                {row.name}
              </StyledTableCell>
              <StyledTableCell>
                <div className="flex flex-wrap gap-1">
                  {[...Array(1)].map((item, index) => (
                    <div key={index} className="flex gap-5">
                      <img
                        className="w-20 rounded-md"
                        src="https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200"
                        alt=""
                      />
                      <div className="flex flex-col justify-between py-2">
                        <h1>Title: Women Saree</h1>
                        <h1>MRP: 1999</h1>
                        <h1>Color: Blue</h1>
                        <h1>Size: M</h1>
                      </div>
                    </div>
                  ))}
                </div>
              </StyledTableCell>
              <StyledTableCell align="right">{row.fat}</StyledTableCell>
              <StyledTableCell align="right">
                <Chip label="Delivered" color="success" variant="outlined" />
              </StyledTableCell>
              <StyledTableCell align="right">
                <Button onClick={handleClick} color="primary">
                  Status
                </Button>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  slotProps={{
                    list: {
                      "aria-labelledby": "basic-button",
                    },
                  }}
                >
                  {orderStatus.map((status: any, index) => (
                    <MenuItem
                      key={index}
                      sx={{ color: status.color }}
                      onClick={() => handleUpdateOrderStatus(order?._id, status.label)}
                    >
                      {status.label}
                    </MenuItem>
                  ))}
                </Menu>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
