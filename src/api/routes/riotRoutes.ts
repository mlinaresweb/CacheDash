// // src/api/routes/riotRoutes.ts
// import { Router } from 'express';
// // import {  getLeagueEntries } from '../controllers/riotController';
// // import { collectAndStoreData  } from '../controllers/matchController';
// // import { findSummonerByNameAndRegion, getSummonerDetailsByNameAndRegion } from '../controllers/summonerController';
// import { getRanking } from '../controllers/rankingController';
// // import { matchController  } from '../controllers/matchExample';
// import {
//     getLatestVersion,
//     getRealms,
//     getLanguages,
//     getChampions,
//     getChampionData,
//     getItems,
//     getRunes,
//     getSummonerSpells,
//     getProfileIcons,
//     getMaps,
//     getChallenges,
//     getChampionFullData,
//     getMissionAssets,
//     getSpellBuffs,
//     getSeasons, getQueues, getStaticMaps, getGameModes, getGameTypes,
//      getChampionNameById, getQueueDescriptionById, getMapNameById, getGameModeByName, getGameTypeByName,
//      getChampionStatsById, getChampionSpellsByName, getChallengeDetailsById, getProfileIconNameById, getRuneById
//     ,getRuneByName, getChallengeByName, getChampionSkinsByName, getChampionTipsByName, getChampionLoreByName
//    ,calculateChampionSpellsByName, getItemById, getItemByName,getMapById,
//    getSummonerSpellById, getSeasonById
// } from '../controllers/dataDragonExample';
// import { championController } from '../controllers/championExample';

// const router = Router();



// /**
//  * RUTA DE RANKING
//  * Esta ruta permite obtener el ranking de jugadores con diversas combinaciones de filtros.
//  * 
//  * USO DE LA RUTA:
//  * 
//  * Sin parámetros:
//  * - Obtén el ranking de todos los jugadores de todas las regiones y tipos de cola.
//  *   GET /api/ranking
//  * 
//  * Con parámetro de región:
//  * - Filtra por región para obtener jugadores de un área específica.
//  *   GET /api/ranking?region=EUW1
//  * 
//  * Con parámetros de región y tier:
//  * - Combinación de región y tier para jugadores dentro de una clasificación específica.
//  *   GET /api/ranking?region=EUW1&tier=DIAMOND
//  * 
//  * Con parámetros de región, tier y queueType:
//  * - Añade el tipo de cola para una búsqueda más específica dentro del tier y la región.
//  *   GET /api/ranking?region=EUW1&tier=DIAMOND&queueType=RANKED_SOLO_5x5
//  * 
//  * Con todos los parámetros posibles:
//  * - La búsqueda más específica que incluye región, tier, tipo de cola y rango.
//  *   GET /api/ranking?region=EUW1&tier=DIAMOND&queueType=RANKED_SOLO_5x5&rank=IV
//  * 
//  */
//             router.get('/champions/rotations', championController.getChampionRotations);
//             router.get('/challenger/league', championController.getLeagueChallenger);
//             router.get('/match', championController.getMatchById);



// router.get('/ranking', getRanking);
// // router.get('/account1', accountsController.getAccountByPuuid);
// // router.get('/account2', accountsController.getSummonerByRiotId); 
// router.get('/latest-version', getLatestVersion);
// router.get('/realms', getRealms);
// router.get('/languages', getLanguages);
// router.get('/champions', getChampions);
// router.get('/champion/:name', getChampionData);
// router.get('/items', getItems);
// router.get('/runes', getRunes);
// router.get('/summoner-spells', getSummonerSpells);
// router.get('/profile-icons', getProfileIcons);
// router.get('/maps', getMaps);
// router.get('/challenges', getChallenges);
// router.get('/champion-full', getChampionFullData);
// router.get('/mission-assets', getMissionAssets);
// router.get('/spellbuffs', getSpellBuffs);
// router.get('/seasons', getSeasons);
// router.get('/queues', getQueues);
// router.get('/static-maps', getStaticMaps);
// router.get('/game-modes', getGameModes);
// router.get('/game-types', getGameTypes);

// router.get('/champion-name/:id', getChampionNameById);
// router.get('/queue-description/:id', getQueueDescriptionById);
// router.get('/map-name/:id', getMapNameById);
// router.get('/game-mode/:name', getGameModeByName);
// router.get('/game-type/:name', getGameTypeByName);


// router.get('/champion-stats/:id', getChampionStatsById);
// router.get('/champion-spells/:name', getChampionSpellsByName);
// // Ruta para calcular los hechizos de un campeón
// router.get('/champion/:name/calculate-spells', calculateChampionSpellsByName);

// router.get('/challenge/id/:id', getChallengeDetailsById);
// router.get('/challenge/name/:name', getChallengeByName);

// router.get('/profile-icon/:id', getProfileIconNameById);
// router.get('/rune/id/:id', getRuneById);
// router.get('/rune/name/:name', getRuneByName);

// router.get('/champion/skins/:name', getChampionSkinsByName);
// router.get('/champion/tips/:name', getChampionTipsByName);
// router.get('/champion/lore/:name', getChampionLoreByName);

// // Ruta para obtener un ítem por ID
// router.get('/item/:id', getItemById);

// // Ruta para obtener un ítem por nombre
// router.get('/item/name/:name', getItemByName);

// router.get('/map/:id', getMapById);

// router.get('/summoner-spell/:id', getSummonerSpellById);

// router.get('/season/:id', getSeasonById);

// export default router;