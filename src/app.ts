import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
// vai ser implementado
//import userRouter from "./modules/users/router";
//import deviceRouter from "./modules/devices/router";
//import reservationRouter from "./modules/reservations/router";

const app = express();

app.use(cors());
app.use(json());

// rotas principais
//app.use("/api/v1/users", userRouter);
//app.use("/api/v1/devices", deviceRouter);
//app.use("/api/v1/reservations", reservationRouter);

export default app;
