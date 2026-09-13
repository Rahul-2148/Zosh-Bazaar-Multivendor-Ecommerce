import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret'
});

export default razorpay;
