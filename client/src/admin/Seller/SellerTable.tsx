import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import { fetchAllSellers } from "../../Redux Toolkit/features/seller/SellerSlice";

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

const accountStatuses = [
  {
    status: "PENDING_VERIFICATION",
    title: "Pending Verification",
    description: "Account is created but not yet verified",
  },
  {
    status: "ACTIVE",
    title: "Active",
    description: "Account is active and in good standing",
  },
  {
    status: "SUSPENDED",
    title: "Suspended",
    description:
      "Account is temporarily suspended, possibly due to a violations",
  },
  {
    status: "DEACTIVATED",
    title: "Deactivated",
    description:
      "Account is deactivated, user may have chosen to deactivate it",
  },
  {
    status: "BANNED",
    title: "Banned",
    description: "Account is permanently banned due to severe violations",
  },
  {
    status: "CLOSED",
    title: "Closed",
    description: "Account is permanently closed, possibly at user request",
  },
];

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number
) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
  };
}

const SellerTable = () => {
  const dispatch = useAppDispatch();
  const { sellers } = useAppSelector((store) => store.seller);

  const [status, setStatus] = useState(accountStatuses[0].status);

  const handleChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as string);
  };

  useEffect(() => {
    dispatch(fetchAllSellers(status));
  }, [dispatch, status]);

  return (
    <>
      <div className="pb-5 w-60">
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Age</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            label="Age"
            value={status}
            onChange={handleChange}
          >
            {accountStatuses.map((status) => (
              <MenuItem value={status.status}>{status.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                Seller Name
              </StyledTableCell>
              <StyledTableCell align="right">Email</StyledTableCell>
              <StyledTableCell align="right">Mobile</StyledTableCell>
              <StyledTableCell align="right">GSTIN</StyledTableCell>
              <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                Business Name
              </StyledTableCell>
              <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                Account Status
              </StyledTableCell>
              <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                Change Status
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sellers.map((item) => (
              <StyledTableRow key={item?._id}>
                <StyledTableCell component="th" scope="row">
                  {item?.sellerName}
                </StyledTableCell>
                <StyledTableCell align="right">{item?.email}</StyledTableCell>
                <StyledTableCell align="right">{item.mobile}</StyledTableCell>
                <StyledTableCell align="right">{item.GSTIN}</StyledTableCell>
                <StyledTableCell align="right">
                  {item?.businessDetails?.businessName}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {item?.accountStatus}
                </StyledTableCell>
                <StyledTableCell align="right">
                  <Button variant="contained" className="whitespace-nowrap">
                    Change Status
                  </Button>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default SellerTable;
