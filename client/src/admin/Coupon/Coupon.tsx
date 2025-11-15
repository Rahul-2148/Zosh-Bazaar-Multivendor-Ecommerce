import { DeleteOutline } from "@mui/icons-material";
import {
  IconButton,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";
import { useEffect } from "react";
import { fetchAllCoupons } from "../../Redux Toolkit/features/admin/AdminCouponSlice";

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

const rows = [createData("Frozen yoghurt", 159, 6.0, 24, 4.0)];

const Coupon = () => {
  const dispatch = useAppDispatch();
  const { coupons } = useAppSelector((store) => store.adminCoupon);

  useEffect(() => {
    dispatch(fetchAllCoupons(localStorage.getItem("jwt") as string));
  }, [dispatch]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
              Coupon Code
            </StyledTableCell>
            <StyledTableCell align="right">Start Date</StyledTableCell>
            <StyledTableCell align="right">End Date</StyledTableCell>
            <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
              Min Order Value
            </StyledTableCell>
            <StyledTableCell align="right">Discount (%)</StyledTableCell>
            <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>
              Status
            </StyledTableCell>
            <StyledTableCell align="right">Delete</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.map((item) => (
            <StyledTableRow key={item._id}>
              <StyledTableCell component="th" scope="row">
                {"zosh50"}
              </StyledTableCell>
              <StyledTableCell align="right">{"2025-10-01"}</StyledTableCell>
              <StyledTableCell align="right">{"2025-10-01"}</StyledTableCell>
              <StyledTableCell align="right">{"1000"}</StyledTableCell>
              <StyledTableCell align="right">{"50"}</StyledTableCell>
              <StyledTableCell align="right">{"Deactive"}</StyledTableCell>
              <StyledTableCell align="right">
                <IconButton color="error">
                  <DeleteOutline />
                </IconButton>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Coupon;
