import express from 'express';
import authRouter from './routes/authRoute';
import jobRouter from './routes/jobRoute';
import otpRoutes from './routes/otp';
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use('/auth', authRouter);
app.use("/job",jobRouter);
app.use("/otp",otpRoutes);


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});