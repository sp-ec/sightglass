import express from "express";
import { companyControllers } from "@/modules/companies/companies.controller";
import { PUBLISHER_CONFIG } from "@/modules/companies/companies.types";

const publisherRoutes = express.Router();
const { getList, getById } = companyControllers(PUBLISHER_CONFIG);

// Every literal path stays above /:id, which would otherwise swallow it
publisherRoutes.get("/list", getList);
publisherRoutes.get("/:id", getById);

export default publisherRoutes;
