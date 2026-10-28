import express from "express";
import { companyControllers } from "@/modules/companies/companies.controller";
import { DEVELOPER_CONFIG } from "@/modules/companies/companies.types";

const developerRoutes = express.Router();
const { getList, getById } = companyControllers(DEVELOPER_CONFIG);

// Every literal path stays above /:id, which would otherwise swallow it
developerRoutes.get("/list", getList);
developerRoutes.get("/:id", getById);

export default developerRoutes;
