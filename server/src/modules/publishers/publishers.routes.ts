import express from "express";
import { getPublisherById, getPublishersList } from "./publishers.controller";

const publisherRoutes = express.Router();

// Every literal path stays above /:publisher_id, which would otherwise swallow it
publisherRoutes.get("/list", getPublishersList);
publisherRoutes.get("/:publisher_id", getPublisherById);

export default publisherRoutes;
