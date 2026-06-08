import express from 'express';
import {
	syncGameListTitles,
	syncGameListDetails,
	syncGameListTags,
} from "@/modules/gameList/gameListController";

const gameListRoutes = express.Router();

gameListRoutes.post("/sync-titles", syncGameListTitles);
gameListRoutes.post("/sync-details", syncGameListDetails);
gameListRoutes.post("/sync-tags", syncGameListTags);
gameListRoutes.get("/search", () => {});

export default gameListRoutes;
