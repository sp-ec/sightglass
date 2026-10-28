import express from "express";
import { getPublishersList } from "./publishers.controller";

const publisherRoutes = express.Router();

publisherRoutes.get("/list", getPublishersList);

export default publisherRoutes;
