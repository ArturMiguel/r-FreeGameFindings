import express, { Request, Response } from "express";
import cors from "cors";

const api = express();
api.use(cors());

api.get("/", (req: Request, res: Response) => {
  return res.status(200).send("ok");
})

const port = process.env.PORT || 3000;
api.listen(port, () => {
  console.log(`API listening on port ${port}`);
})