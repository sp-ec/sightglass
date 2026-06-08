import express from 'express';
import {
	syncGameListTitles,
	syncGameListDetails,
} from "@/modules/gameList/gameListController";

const gameListRoutes = express.Router();

gameListRoutes.post("/sync-titles", syncGameListTitles);
gameListRoutes.post("/sync-details", syncGameListDetails);
gameListRoutes.get("/search", () => {});

export default gameListRoutes;
