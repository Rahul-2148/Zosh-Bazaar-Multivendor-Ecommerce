import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Button, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import type { IProduct } from "../../types/productTypes";

interface ProductTableProps {
  products: IProduct[];
}

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
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const ProductTable = ({ products }: ProductTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 800 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Images</StyledTableCell>
            <StyledTableCell align="right">Title</StyledTableCell>
            <StyledTableCell align="right">Brand</StyledTableCell>
            <StyledTableCell align="right">MRP</StyledTableCell>
            <StyledTableCell align="right" sx={{ whiteSpace: "nowrap" }}>Selling Price</StyledTableCell>
            <StyledTableCell align="right">Color</StyledTableCell>
            <StyledTableCell align="right">Stock</StyledTableCell>
            <StyledTableCell align="right">Update</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <StyledTableRow key={product._id}>
              <StyledTableCell component="th" scope="row">
                <div className="flex flex-wrap gap-1">
                  {product.images?.slice(0, 4).map((img, index) => (
                    <img
                      key={index}
                      className="w-15 rounded-md"
                      src={img}
                      alt={product.title}
                    />
                  ))}
                </div>
              </StyledTableCell>
              <StyledTableCell align="right">{product.title}</StyledTableCell>
              <StyledTableCell align="right">{product.brand}</StyledTableCell>
              <StyledTableCell align="right">
                {product.mrpPrice}
              </StyledTableCell>
              <StyledTableCell align="right">
                {product.sellingPrice}
              </StyledTableCell>
              <StyledTableCell align="right">{product.color}</StyledTableCell>
              <StyledTableCell align="right">
                <Button size="small">{product.countInStock || "N/A"}</Button>
              </StyledTableCell>
              <StyledTableCell align="right">
                <IconButton color="primary" className="bg-[teal]">
                  <Edit />
                </IconButton>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable;
