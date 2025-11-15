import { TextField } from "@mui/material";

interface BecomeSellerStep3Props {
  formik: any;
}

const BecomeSellerStep3 = ({ formik }: BecomeSellerStep3Props) => {
  return (
    <div className="space-y-5">
      {/* account number */}
      <div>
        <TextField
          fullWidth
          id="accountNumber"
          name="bankDetails.accountNumber"
          label="Account Number"
          value={formik.values.bankDetails?.accountNumber}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.accountNumber &&
            Boolean(formik.errors.bankDetails?.accountNumber)
          }
          helperText={
            formik.touched.bankDetails?.accountNumber &&
            formik.errors.bankDetails?.accountNumber
          }
        />
      </div>

      {/* account holder name */}
      <div>
        <TextField
          fullWidth
          id="accountHolderName"
          name="bankDetails.accountHolderName"
          label="Account Holder Name"
          value={formik.values.bankDetails?.accountHolderName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.accountHolderName &&
            Boolean(formik.errors.bankDetails?.accountHolderName)
          }
          helperText={
            formik.touched.bankDetails?.accountHolderName &&
            formik.errors.bankDetails?.accountHolderName
          }
        />
      </div>

      {/* bank name */}
      <div>
        <TextField
          fullWidth
          id="bankName"
          name="bankDetails.bankName"
          label="Bank Name"
          value={formik.values.bankDetails?.bankName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.bankName &&
            Boolean(formik.errors.bankDetails?.bankName)
          }
          helperText={
            formik.touched.bankDetails?.bankName &&
            formik.errors.bankDetails?.bankName
          }
        />
      </div>

      {/* ifsc code */}
      <div>
        <TextField
          fullWidth
          id="ifscCode"
          name="bankDetails.ifscCode"
          label="IFSC Code"
          value={formik.values.bankDetails?.ifscCode}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.ifscCode &&
            Boolean(formik.errors.bankDetails?.ifscCode)
          }
          helperText={
            formik.touched.bankDetails?.ifscCode &&
            formik.errors.bankDetails?.ifscCode
          }
        />
      </div>

      {/* account branch */}
      <div>
        <TextField
          fullWidth
          id="accountBranch"
          name="bankDetails.accountBranch"
          label="Account Branch"
          value={formik.values.bankDetails?.accountBranch}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.accountBranch &&
            Boolean(formik.errors.bankDetails?.accountBranch)
          }
          helperText={
            formik.touched.bankDetails?.accountBranch &&
            formik.errors.bankDetails?.accountBranch
          }
        />
      </div>

      {/* account holder email */}
      <div>
        <TextField
          fullWidth
          id="accountHolderEmail"
          name="bankDetails.accountHolderEmail"
          label="Account Holder Email"
          value={formik.values.bankDetails?.accountHolderEmail}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.bankDetails?.accountHolderEmail &&
            Boolean(formik.errors.bankDetails?.accountHolderEmail)
          }
          helperText={
            formik.touched.bankDetails?.accountHolderEmail &&
            formik.errors.bankDetails?.accountHolderEmail
          }
        />
      </div>
    </div>
  );
};

export default BecomeSellerStep3;
