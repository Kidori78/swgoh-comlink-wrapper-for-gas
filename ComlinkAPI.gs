/**
  * 
  * @Class Comlink
  *
  * Comlink is a client wrapper for SWGOH Comlink API to make connecting and requesting information from it easier. There are 3 configurations for using this wrapper:
  * - using a hosted Comlink and the swgoh-utils/gamedata github repo
  * - using Comlink for Github which puts everything in your own repo
  * - using swgoh.gg api and the swgoh-utils/gamedata github repo
  *
  * Available Methods
  * - .fetchPlayers()
  * - .fetchPlayerArena()
  * - .fetchGuilds()
  * - .fetchGuildRosters()
  * - .fetchData()
  * - .fetchEnums()
  * - .fetchMetadata()
  * - .fetchLocalization()
  * - .fetchEvents()
  * - .fetchGuildByName()
  * - .fetchGuildByCriteria()
  * - .fetchGrandArenaBracket()
  * - .fetchGrandArenaLeaderboards()
  * - .fetchGuildLeaderboards()
  * 
  * Also contains functions
  * - .getModSetDefinitions()
  * - .getStatDefinitions()
  *
  * @param {String} host - The full web address where Comlink is w/out the forward slash at the end.
  * @param {String} accessKey - Optional: The public key required if HMAC has been enabled for Comlink connections
  * @param {String} secretKey - Optional: The private key required if HMAC has been enabled for Comlink connections
  * @param {String} language - Optional: The ISO 639 language code and ISO 3166 country code for the language. Default is "ENG_US"
  * @param {Integer} rateLimit - Optional: The number of player profiles to get at once. Default is 100, limit is 100.
  * 
*/
function Comlink(host, accessKey = null, secretKey = null, language = "ENG_US", rateLimit = 100) {
  /**
  */
  // Constructor //
  //-->Endpoints
  this.endpoint_player ="/player";
  this.endpoint_playerArena ="/playerArena";
  this.endpoint_guild ="/guild";
  this.endpoint_getGuilds ="/getGuilds";
  this.endpoint_getEvents ="/getEvents";
  this.endpoint_getLeaderboard ="/getLeaderboard";
  this.endpoint_getGuildLeaderboard ="/getGuildLeaderboard";
  this.endpoint_data ="/data";
  this.endpoint_metadata ="/metadata";
  this.endpoint_localization ="/localization";
  this.endpoint_enums ="/enums";
  //-->Security settings
  this.accessKey = accessKey;
  this.secretKey = secretKey;
  this.hmacSignature;
  this.useHMAC=false;
  if(this.accessKey !== null && this.secretKey !== null) {
    this.useHMAC=true;
  }
  //-->URLs
  this.host = host;
  this.usingGG = false;
  this.usingGithub = false;
  var url
  this.url_data =`https://raw.githubusercontent.com/swgoh-utils/gamedata/main/`;
  if(host.indexOf(",") > -1){
    this.host = host.split(",");
    url = this.host[0];
    if(this.accessKey.indexOf(",") > -1){
      this.accessKey = this.accessKey.split(",");
    }
    if(this.secretKey.indexOf(",") > -1){
      this.secretKey = this.secretKey.split(",");
    }
  }else{
    url = `${host}`;
    if(host.indexOf("github") > -1){
      this.usingGithub = true;
      this.endpoint_player = "/player/";
      this.url_data = host + "/data/";
    }
    if(host.indexOf("swgoh.gg") > -1){
      this.usingGG = true;
      this.endpoint_player = "/player/";
      this.endpoint_guild = "/guild-profile/";
    }
  }
  this.url_player = url + this.endpoint_player;
  this.url_playerArena = url + this.endpoint_playerArena;
  this.url_guild = url + this.endpoint_guild;
  this.url_getGuilds = url + this.endpoint_getGuilds;
  this.url_getEvents = url + this.endpoint_getEvents;
  this.url_getLeaderboard = url + this.endpoint_getLeaderboard;
  this.url_getGuildLeaderboard = url + this.endpoint_getGuildLeaderboard;
  this.url_metadata = url + this.endpoint_metadata;
  this.url_enums = url + this.endpoint_enums;
  //-->Other Settings
  this.language = this.getLangFileName_(language);
  this.rateLimit = rateLimit;

  //-->Maps and data for building units. Eliminates calling fetch each time.
  this.unitMap = null;
  this.categoryMap = null;
  this.skillMap = null;
  this.targetMap = null;
  this.datacronMap = null;
  this.abilityMap = null;
  this.modMap = null;
  this.localization = null;
  this.gameData = null;
}


/************************************************************
 * Returns the specified player profile from the api
 * @param {Array} id - The player's allycode or playerId to retrieve data for
 * @param {Bool} enums - Optional: Flag to return enum values in the response
 * @param {Bool} preBuild - Optional: Flag to return response with additional data that is all localized
 * @param {Integer} limit - Optional: Number of requests to send at once
 * @return {Array} Returns an array of all requested player profile objects in json format
*/
Comlink.prototype.fetchPlayers = function(id, enums = false, preBuild = false){
  var request = [];
  var batches = [];
  var playerData = [];
  var response = [];
  var limit = this.rateLimit;
  if(this.usingGithub || this.usingGG){
    let url = "";
    id.forEach(player => {
        url = (this.usingGithub) ? this.url_player + player + ".json" : this.url_player + player;
        request.push(this.requestParameters_(url,"{}","GET"));
    });
    response = this.fetchAllAPI_(request);

    if(this.usingGG){
      response.forEach(player => {
        playerData.push(this.convertPlayerProfile_(player));
      });
    } else {
      if(preBuild){
        response.forEach(player => {
          playerData.push(this.getBuiltPlayerData_(player));
        });
      } else {
        response.forEach(player => {
          playerData.push(player);
        });
      }
    }
    return playerData;
  } else {
    if(Array.isArray(this.host)){
      let maxURLs = this.host.length;
      let urlX = 0;
      let accessKey = this.accessKey;
      let secretKey = this.secretKey;
      id.forEach(player => {
          if(Array.isArray(this.accessKey)){
            accessKey = this.accessKey[urlX];
          }
          if(Array.isArray(this.secretKey)){
            secretKey = this.secretKey[urlX];
          }
        request.push(this.requestParameters_(this.host[urlX] + this.endpoint_player,this.getPayload_(this.endpoint_player,player,enums),"POST",accessKey,secretKey));
        urlX++;
        if(urlX >= maxURLs){
          urlX = 0;
        }
      });
    }else{
      id.forEach(player =>
          request.push(this.requestParameters_(this.url_player,this.getPayload_(this.endpoint_player, player, enums)))
      );
    }
    while (request.length > 0) {
      if(limit > request.length){
        limit = request.length;
      }
      batches.push(request.splice(0, limit));
    }
    batches.forEach(batch => {
      response.push(this.fetchAllAPI_(batch));
    });
    
    if(preBuild){
      response.forEach(batch => {
        batch.forEach(player => { 
          playerData.push(this.getBuiltPlayerData_(player))
        });
      });
    }else{
      response.forEach(batch => {
        batch.forEach(player => {
          playerData.push(player)
        });
      });
    }
    return playerData;
  }
}


/************************************************************
 * Returns the specified player arena profile from the api
 * @param {Array} id - The player's allycode or playerId to retrieve data for
 * @param {Bool} enums - Optional: Flag to return enum values in the response
 * @param {Bool} preBuild - Optional: Flag to return response with additional data that is all localized
 * @param {Integer} limit - Optional: Number of requests to send at once
 * @return {Array} Returns an array of all requested player profile objects in json format
*/
Comlink.prototype.fetchPlayerArena = function(id, enums = false, preBuild = false){
  if(this.usingGithub || this.usingGG){
    this.fetchPlayers(id, enums, preBuild);
    return;
  }
  if(Array.isArray(this.host)){
    let maxURLs = this.host.length;
    let urlX = 0;
    let accessKey = this.accessKey;
    let secretKey = this.secretKey;
    id.forEach(player => {
        if(Array.isArray(this.accessKey)){
          accessKey = this.accessKey[urlX];
        }
        if(Array.isArray(this.secretKey)){
          secretKey = this.secretKey[urlX];
        }
      request.push(this.requestParameters_(this.host[urlX] + this.endpoint_playerArena,this.getPayload_(this.endpoint_playerArena,player,enums),"POST",accessKey,secretKey));
      urlX++;
      if(urlX >= maxURLs){
        urlX = 0;
      }
    });
  }else{
    id.forEach(player =>
        request.push(this.requestParameters_(this.url_playerArena,this.getPayload_(this.endpoint_playerArena, player, enums)))
    );
  }
  while (request.length > 0) {
    if(limit > request.length){
      limit = request.length;
    }
    batches.push(request.splice(0, limit));
  }
  batches.forEach(batch => {
    response.push(this.fetchAllAPI_(batch));
  });
  
  if(preBuild){
    response.forEach(batch => {
      batch.forEach(player => { 
        playerData.push(this.getBuiltPlayerData_(player));
      });
    });
  }else{
    response.forEach(batch => {
      batch.forEach(player => {
        playerData.push(player);
      });
    });
  }
  return playerData;
}


/************************************************************
 * Returns the specified guild profiles from the api.
 * @param {Array} id - An array of strings containing the player id, allycode or guild id to retrieve guild data for
 * @param {Bool} enums - Optional: Flag to return enum values in the response
 * @param {Bool} isPlayerID - Optional: Use when sending playerIds to get guilds
 * @return {Array} Returns and array of all requested guild profiles in json format
*/
Comlink.prototype.fetchGuilds = function(id, enums = false, isPlayerID = false){
  var rawData = [];
  var guildIds = [];
  var response = [];
  var request = [];
  //-->Find guild ids
  if(this.usingGithub || this.usingGG){
    let url = "";
    if(isPlayerID || id[0].toString().length < 12){
      id.forEach(player => {
        url = (this.usingGithub) ? this.url_player + player + "_PROFILE.json" : this.url_player + player;
        request.push(this.requestParameters_(url, "{}", "GET"));
      });
      response = this.fetchAllAPI_(request);
      response.forEach(player => {
        guildIds.push(player.data.guild_id);
      });
      response = [];
      request = [];
    } else {
      guildIds = id;
    }
    guildIds.forEach(guild => {
      url = (this.usingGithub) ? this.url_guild + guild + "_PROFILE.json" : this.url_guild + guild;
      request.push(this.requestParameters_(url,"{}","GET"));
    });
    response = this.fetchAllAPI_(request);
    response.forEach(guild => {
      rawData.push((this.usingGithub) ? guild.guild : guild.data);
    });
  } else {
    if(isPlayerID || id[0].toString().length < 12){
      id.forEach(player => {
        request.push(this.requestParameters_(this.url_player,this.getPayload_(this.endpoint_player, player, enums)));
      });
      response = this.fetchAllAPI_(request);
      response.forEach(player => {
        guildIds.push(player.guildId);
      });
      response = [];
      request = [];
    } else {
      guildIds = id;
    }
    //-->Grab guild data
    guildIds.forEach(guild => {
      request.push(this.requestParameters_(this.url_guild,this.getPayload_(this.endpoint_guild, guild, enums)));
    });

    response = this.fetchAllAPI_(request);
    response.forEach(guild => {
      rawData.push(guild.guild);
    });
  }

  return rawData;
}


/************************************************************
 * Returns the specified guild's members and their roster.
 * @param {Array} id - An array of strings containing the player id, allycode or guild id to retrieve guild data for
 * @param {Bool} enums - Optional: Flag to return enum values in the response
 * @param {Bool} preBuild - Optional: Flag to return response with additional data that is all localized
 * @param {Bool} isPlayerID - Optional: Use when sending playerIds to get guilds
 * @return {Array} Returns an array of all requested guild profiles including member profiles and rosters in json format
*/
Comlink.prototype.fetchGuildRosters = function(id, enums = false, preBuild = false, isPlayerID = false){
  var guildIds = [];
  var guildData = [];
  var memberData = [];

  if(this.usingGithub){
    let memberMap = [];
    let tempGuild = [];
    let request = [];
    let response = [];
    let mID = "";
    id.forEach(guild => {
      try{
        request = [
          this.requestParameters_(this.github_url + "/guild/" + guild + "_PROFILE.json","{}","GET"),
          this.requestParameters_(this.github_url + "/guild/" + guild + "_ROSTER1.json","{}","GET"),
          this.requestParameters_(this.github_url + "/guild/" + guild + "_ROSTER2.json","{}","GET"),
          this.requestParameters_(this.github_url + "/guild/" + guild + "_ROSTER3.json","{}","GET"),
          this.requestParameters_(this.github_url + "/guild/" + guild + "_ROSTER4.json","{}","GET"),
          this.requestParameters_(this.github_url + "/guild/" + guild + "_ROSTER5.json","{}","GET")
        ];
        response = this.fetchAllAPI_(request);
      }catch(e){
        //Do nothing
        console.log(e);
      }
      //Form proper object with data
      tempGuild = response[0].guild;
      for(var i=1; i < response.length; i++){
        response[i].forEach(player => {
          if(preBuild){
            memberData.push(this.getBuiltPlayerData_(player));
          } else{
            memberData.push(player);
          }
        });
      }
      for(var i=0; i < memberData.length;i++){
        memberMap[memberData[i].playerId] = i; 
      }
      for(var m=0; m < tempGuild.member.length; m++){
        mID = tempGuild.member[m].playerId;
        tempGuild.member[m]["localZoneOffsetMinutes"] = memberData[memberMap[mID]].localTimeZoneOffsetMinutes;
        tempGuild.member[m]["allyCode"] = memberData[memberMap[mID]].allyCode;
        tempGuild.member[m]["rosterUnit"] = memberData[memberMap[mID]].rosterUnit;
        tempGuild.member[m]["datacron"] = memberData[memberMap[mID]].datacron;
        tempGuild.member[m]["pvpProfile"] = memberData[memberMap[mID]].pvpProfile;
        tempGuild.member[m]["playerRating"] = memberData[memberMap[mID]].playerRating;
        tempGuild.member[m]["profileStat"] = memberData[memberMap[mID]].profileStat;
        tempGuild.member[m]["unlockedPlayerTitle"] = memberData[memberMap[mID]].unlockedPlayerTitle;
        tempGuild.member[m]["unlockedPlayerPortrait"] = memberData[memberMap[mID]].unlockedPlayerPortrait;
        tempGuild.member[m]["selectedPlayerTitle"] = memberData[memberMap[mID]].selectedPlayerTitle;
        tempGuild.member[m]["selectedPlayerPortrait"] = memberData[memberMap[mID]].selectedPlayerPortrait;
      }
      guildData.push(tempGuild);
      memberData = [];
      memberMap = [];
      tempGuild = [];
    });
  } else {
    //-->Find guild ids
    if(isPlayerID || id[0].toString().length < 12){
      this.fetchPlayers(id).forEach(player => {
        guildIds.push(player.guildId);
      });
    } else {
      guildIds = id;
    }
    //-->Grab guild data
    guildData = this.fetchGuilds(guildIds,enums);

    //-->Grab member rosters
    let playerIDs = [];
    let memberIndex = [];
    if(this.usingGG){
      for(let g = 0; g < guildData.length;g++){
        playerIDs = [];
        memberIndex = [];
        //-->Add player data to member profile
        for(let m = 0; m < guildData[g].members.length; m++){
          if(guildData[g].members[m].ally_code !== null){
            playerIDs.push(guildData[g].members[m].ally_code);
            memberIndex[guildData[g].members[m].ally_code] = m;
          }else{
            console.log("Need to register on swgoh.gg: "+guildData[g].members[m].player_name);
          }
        }
        memberData = this.fetchPlayers(playerIDs,false,false);
        //Build guild data
        guildData[g]["profile"] = {
          "id": guildData[g].guild_id,
          "name": guildData[g].name,
          "externalMessageKey": guildData[g].external_message,
          "enrollmentStatus": guildData[g].enrollment_status,
          "memberCount": guildData[g].member_count,
          "memberMax": 50,
          "levelRequirement": guildData[g].level_requirement,
          "guildType": guildData[g].guild_type,
          "guildEventTracker": []
        };
        guildData[g]["nextChallengesRefresh"] = "";
        guildData[g]["recentRaidResult"] = [];
        guildData[g]["recentTerritoryWarResult"] = [];
        guildData[g]["member"] = guildData[g].members.splice(0);
        //Adjust member data
        memberData.forEach(member => {
          guildData[g].member[memberIndex[member.allyCode]]["localZoneOffsetMinutes"] = "";  //GGdoesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["allyCode"] = member.allyCode;
          guildData[g].member[memberIndex[member.allyCode]]["rosterUnit"] = member.rosterUnit;
          guildData[g].member[memberIndex[member.allyCode]]["datacron"] = member.datacron;
          guildData[g].member[memberIndex[member.allyCode]]["pvpProfile"] = member.pvpProfile;
          guildData[g].member[memberIndex[member.allyCode]]["playerRating"] = member.playerRating;
          guildData[g].member[memberIndex[member.allyCode]]["profileStat"] = member.profileStat;
          guildData[g].member[memberIndex[member.allyCode]]["unlockedPlayerTitle"] = []; //GG doesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["unlockedPlayerPortrait"] = [];
          guildData[g].member[memberIndex[member.allyCode]]["selectedPlayerTitle"] = {};
          guildData[g].member[memberIndex[member.allyCode]]["selectedPlayerPortrait"] = {};
          guildData[g].member[memberIndex[member.allyCode]]["seasonStatus"] = [];  //GG doesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["memberContribution"] = [];  //GG doesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["playerName"] = member.name;
          guildData[g].member[memberIndex[member.allyCode]]["playerLevel"] = member.level;
          guildData[g].member[memberIndex[member.allyCode]]["playerId"] = "";  //GG doesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["lastActivityTime"] =  "";  //GG doesn't provide this
          guildData[g].member[memberIndex[member.allyCode]]["guildJoinTime"] = (new Date(guildData[g].member[memberIndex[member.allyCode]]["guild_join_time"].replace("-","/").replace("T"," ")).getTime() / 1000).toString();
          guildData[g].member[memberIndex[member.allyCode]]["memberLevel"] = guildData[g].member[memberIndex[member.allyCode]].member_level;
          guildData[g].member[memberIndex[member.allyCode]]["galacticPower"] = guildData[g].member[memberIndex[member.allyCode]].galactic_power;
          guildData[g].member[memberIndex[member.allyCode]]["shipGalacticPower"] = "";
          guildData[g].member[memberIndex[member.allyCode]]["characterGalacticPower"] = "";
          guildData[g].member[memberIndex[member.allyCode]]["leagueId"] = guildData[g].member[memberIndex[member.allyCode]].league_id;
          guildData[g].member[memberIndex[member.allyCode]]["lifetimeSeasonScore"] = guildData[g].member[memberIndex[member.allyCode]].lifetime_season_score;
          guildData[g].member[memberIndex[member.allyCode]]["playerTitle"] = guildData[g].member[memberIndex[member.allyCode]].title;
        });
      }

    }else{
      for(let g = 0; g < guildData.length;g++){
        playerIDs = [];
        memberIndex = [];
        //-->Add player data to member profile
        for(let m = 0; m < guildData[g].member.length; m++){
          playerIDs.push(guildData[g].member[m].playerId);
          memberIndex[guildData[g].member[m].playerId] = m;
        }
        memberData = this.fetchPlayers(playerIDs,false,preBuild);
        //Build guild data
        memberData.forEach(member => {
          guildData[g].member[memberIndex[member.playerId]]["localZoneOffsetMinutes"] = member.localTimeZoneOffsetMinutes;
          guildData[g].member[memberIndex[member.playerId]]["allyCode"] = member.allyCode;
          guildData[g].member[memberIndex[member.playerId]]["rosterUnit"] = member.rosterUnit;
          guildData[g].member[memberIndex[member.playerId]]["datacron"] = member.datacron;
          guildData[g].member[memberIndex[member.playerId]]["pvpProfile"] = member.pvpProfile;
          guildData[g].member[memberIndex[member.playerId]]["playerRating"] = member.playerRating;
          guildData[g].member[memberIndex[member.playerId]]["profileStat"] = member.profileStat;
          guildData[g].member[memberIndex[member.playerId]]["unlockedPlayerTitle"] = member.unlockedPlayerTitle;
          guildData[g].member[memberIndex[member.playerId]]["unlockedPlayerPortrait"] = member.unlockedPlayerPortrait;
          guildData[g].member[memberIndex[member.playerId]]["selectedPlayerTitle"] = member.selectedPlayerTitle;
          guildData[g].member[memberIndex[member.playerId]]["selectedPlayerPortrait"] = member.selectedPlayerPortrait;
        });
      }
    }
  }

  return guildData;
}

/************************************************************
 * Returns the game data collections
 * @param {Array} collections - An array of specified collection names
 * - Accepts all collection names found at https://github.com/swgoh-utils/swgoh-comlink/wiki/Game-Data
 * - Also accepts the following named groups
 * - "for_gameData" = collections required for building gameData.json
 * - "for_conquest" - collections related to conquest
 * - "for_abilities" - collections related to unit abilities
 * - "for_territoryBattles" - collections related to Territory Battles
 * - "for_playerProfile" - all collections used to expand player data
 * _ "for_datacrons" - collections related to Datacrons
 * - "for_grandArena" - collections related to Grand Arena
 * @return {Array} Returns an array of all requested collections in json format
*/
Comlink.prototype.fetchData = function(collections = []){
  let request = [];
  let dataOrder = [];
  let requestedData = [];
  let getCollections = [];

  //-->Build array of collections to find
  collections.forEach(function(collection){
    if(collection.indexOf("for_") === 0){
      let tempColl = [];
      switch(collection){
        case "for_allUsed":
          tempColl = ["ability", "artifactDefinition", "artifactTierDefinition","battleTargetingRule", "campaign","category", "conquestDefinition", "conquestMission","consumableDefinition", "consumableTierDefinition", "consumableType", "datacronSet", "datacronTemplate","datacronAffixTemplateSet", "equipment", "material", "mysteryBox", "recipe", "relicTierDefinition", "seasonDefintion", "seasonRewardTable", "skill", "statMod", "statModSet", "statProgression", "table", "territoryBattleDefinition", "territoryTournamentRewardTable", "territoryTournamentDefinition", "territoryTournamentDivisionDefinition", "territoryTournamentLeagueDefinition", "xpTable"];
          break;
        case "for_gameData":
          tempColl = ["equipment", "skill", "units","relicTierDefinition","statModSet","statProgression","table","xpTable"];
          break;
        case "for_conquest":
          tempColl = ["artifactDefinition","artifactTierDefinition","conquestDefinition","conquestMission","consumableDefinition", "consumableTierDefinition","consumableType"];
          break;
        case "for_abilities":
          tempColl = ["ability","recipe","skill","units_gas"];
          break;
        case "for_territoryBattles":
          tempColl = ["campaign","mysteryBox","equipment","material","table","territoryBattleDefinition","ability","units_gas","category"];
          break;
        case "for_playerProfile":
          tempColl = ["units_gas","category","skill","statMod","battleTargetingRule", "datacronSet","ability"];
          break;
        case "for_datacrons":
          tempColl = ["datacronSet","datacronTemplate","datacronAffixTemplateSet"];
          break;
        case "for_grandArena":
          tempColl = ["seasonDefinition","seasonRewardTable","territoryTournamentDailyRewardTable","territoryTournamentDefinition","territoryTournamentDivisionDefinition","territoryTournamentLeagueDefinition"];
          break;
        default:
          throw new Error("ERROR: COLLECTION NOT FOUND\nThe collection group specified does not exist.");
      }

      tempColl.forEach(function(coll){
        if(getCollections[coll] === undefined){
          getCollections[coll] = coll
        }
      });
    }else{
      getCollections[collection] = collection;
    }
  });

  //-->Fetch all of the data from the api  
  for(const col in getCollections){    
    request.push(this.requestParameters_(this.url_data + col + ".json", "{}", "GET"));
    if(col === "units_gas") { col = "units"};
    dataOrder.push(col);   
  }
  let response = this.fetchAllAPI_(request);
  for(let r=0; r < response.length; r++){
    requestedData[dataOrder[r]] = response[r].data;
  }

  return requestedData;
}


/************************************************************
 * Returns the current and upcoming events for the game
 * @param {Boolean} enums - Optional: Flag to return enum values in the response
*/
Comlink.prototype.fetchEvents = function(enums = false){
  return this.fetchAPI_(this.url_getEvents, this.getPayload_(this.endpoint_getEvents,null,enums));
}


/************************************************************
 * Returns a list of guild profiles that contain the specified name in them
 * @param {String} name - The name of the guild
 * @param {Integer} count - Optional: The number of results to return
 * @param {Boolean} enums - Optional: Flag to return enum values in the response
 * @return {Array} The list of guild profiles 
*/
Comlink.prototype.fetchGuildByName = function(name,count = 10000, enums = false){
  let options = { name: name, count: count};
  return this.fetchAPI_(this.url_getGuilds, this.getPayload_(this.endpoint_getGuilds,null,enums,options));
}


/************************************************************
 * Returns a list of guild profiles that contain the specified name in them
 * @param {Object} options - Contains the keys and values to search for:
 *  - minMemberCount: 1-50 Default: 1
 *  - maxMemberCount: 1-50 Default: 50
 *  - minGuildGalacticPower: 1+ Default: 1
 *  - maxGuildGalacticPower: 1+ Default: 999999999
 *  - count: 1-10000 Default: 10000
 * @param {Boolean} enums - Optional: Flag to return enum values in the response
 * @return {Array} THe list of guild profiles
*/
Comlink.prototype.fetchGuildByCriteria = function(options = {}, enums = false){
  return this.fetchAPI_(this.url_getGuilds, this.getPayload_(this.endpoint_getGuilds,null,enums,options));
}


/************************************************************
 * Returns the specified GAC Bracket leaderboard. Can only be retrieved during GAC and only for that GAC.
 * @param {String} eventID - The Event ID and Instance ID from the /getEvents endpoint
 *  - E.G. "CHAMPIONSHIPS_GRAND_ARENA_GA2_EVENT_SEASON_36:O1676412000000"
 * @param {String} groupID - The Event ID, Instance ID, League name, and bracket number 0+ separated by :
 *  - E.G. "CHAMPIONSHIPS_GRAND_ARENA_GA2_EVENT_SEASON_36:O1676412000000:KYBER:100"
 * @return {Object} A list of all player IDs
*/
Comlink.prototype.fetchGrandArenaBracket = function(eventID, groupID, enums = false){
  let options = { eventInstanceId: eventID, groupId: groupID};
  return this.fetchAPI_(this.url_getLeaderboard, this.getPayload_(this.endpoint_getLeaderboard,null,enums,options));
}


/************************************************************
 * Returns the specified Top 50 Grand Arena League and Division Leaderboards
 * @param {Integer} league - The numeric value for the league
 *  - 20 = Carbonite
 *  - 40 = Bronzium
 *  - 60 = Chromium
 *  - 80 = Aurodium
 *  - 100 = Kyber
 * @param {Integer} division - The numeric value for the division
 *  - 5 = 5
 *  - 10 = 4
 *  - 15 = 3
 *  - 20 = 2
 *  - 25 = 1
 * @return {Object} A list of all players in the leaderboard
*/
Comlink.prototype.fetchGrandArenaLeaderboards = function(league, division, enums = false){
  let options = {league: league, division: division};
  return this.fetchAPI_(this.url_getLeaderboard, this.getPayload_(this.endpoint_getLeaderboard,null,enums,options));
}


/************************************************************
 * Returns the specified guild leaderboard
 * @param {Integer} type - The type of leaderboard to get
 *  - 0 = Total Raid Points
 *  - 2 = Specified Raid Points
 *  - 3 = Galactic Power
 *  - 4 = Territory Battle
 *  - 5 = Territory Wars
 * @param {Integer} month - Optional: Indicates returning this month or previous
 *  - 0 = Current month
 *  - 1 = Previous month
 * @param {Integer} count - Optional: The number of results tp return. Default and max is 200
 * @param {String} event The id of the event to get. Required for types 2, 4, and 5.
 *  - RAIDS (2)
 *  - sith_raid = Sith Triumverate
 *  - rancor = The Pit
 *  - aat = Tank Takedown
 *  - rancor_challenge = The Pit: Challenge Tier
 * - TERRITORY BATTLES (4)
 *  - t01D = Rebel Assault
 *  - t02D = Imperial Retaliation
 *  - t03D = Separatist Might
 *  - t04D = Republic Offensive
 *  - t05D = Rise of the Empire
 * - TERRITORY WARS (5)
 *  - TERRITORY_WAR_LEADERBOARD = Territory War
*/
Comlink.prototype.fetchGuildLeaderboards = function(type, month = 0, count = 200, event = null, enums = false){
  let options = {leaderboardType: type, monthOffset: month, count: count };
  if(event !== null){ 
    options["defId"] = event; 
  }
  return this.fetchAPI_(this.url_getGuildLeaderboard, this.getPayload_(this.endpoint_getGuildLeaderboard,null,enums,options));
}


/************************************************************
 * Returns the enums used for the game data
*/
Comlink.prototype.fetchEnums = function(){
  return this.fetchAPI_(this.url_enums, this.getPayload_(this.endpoint_enums), "GET");
}


/************************************************************
 * Returns the enums used for the game data
*/
Comlink.prototype.fetchMetadata = function(){
  return this.fetchAPI_(this.url_metadata, this.getPayload_(this.endpoint_metadata), "POST");
}


/************************************************************
 * Returns the localization for the game data
 * @param {String} language - The ISO 639 language code and ISO 3166 country code for the language. Default is "ENG_US" 
*/
Comlink.prototype.fetchLocalization = function(language = this.language){
  if(this.localization !== null){ return this.localization }
  var localization = [];
  localization = this.fetchAPI_(this.url_data + language, "{}", "GET").data;
  this.localization = localization;
  return localization;
}


/***********************************************************************************
 * Attempts to request metadata in order to wake up services that go to sleep
 */
Comlink.prototype.wakeUpService = function(){
  var request = [];
  var response
  if(Array.isArray(this.host)){
    var accessKey = this.accessKey;
    var secretKey = this.secretKey;
    for(let i=0; i < this.host.length; i++){
      if(Array.isArray(this.accessKey)){
        accessKey = this.accessKey[i];
      }
      if(Array.isArray(this.secretKey)){
        secretKey = this.secretKey[i];
      }
      request.push(this.requestParameters_(this.host[i] + this.endpoint_metadata,this.getPayload_(this.endpoint_metadata),"POST",accessKey,secretKey));
    }
    response = this.fetchAllAPI_(request);
  } else{
    response = this.fetchAPI_(this.host + this.endpoint_metadata, this.getPayload_(this.endpoint_metadata), "POST");
  }
  return response;
}


/**************************************************
  * Attempts to request JSON data from the APIs.
  * @param {String} url - Full web address of Comlink including endpoint
  * @param {Object} payload - The requested data as an object literal
  * @param {String} methodType - The type of method to get the request in: Default is "POST"
*/
Comlink.prototype.fetchAPI_ = function(url,payload, methodType = "POST") {
  let endpoint = url.substring(url.lastIndexOf("/"),url.length);
  let parameters;
  let postHeader={};
  parameters={
    method: methodType,
    contentType: 'application/json',
    muteHttpExceptions: true
  };
  if(this.useHMAC && endpoint !== this.endpoint_enums && methodType !== "GET") {
    let requestTime = new Date().getTime().toString();
    this.getHMAC_(endpoint,payload,requestTime);
    postHeader={
      'Authorization': `HMAC-SHA256 Credential=${this.accessKey},Signature=${this.hmacSignature}`,
      'X-Date': requestTime
    };
  }
  parameters["headers"] = postHeader;
  if(methodType === "POST"){
    parameters["payload"] = JSON.stringify(payload);
    parameters.headers["Accept-Encoding"] = "gzip, deflate";
  }
  //--> Try the request multiple times
  var msg, response
  for(var tries = 1; tries < 4;tries++){
    try{
      response = UrlFetchApp.fetch(url,parameters);
      break;
    } catch(error) {
      if(tries === 3){
        throw new Error(error);
      }
      switch(tries){
        case 2:
          Utilities.sleep(2000);
          break;
        default:
          Utilities.sleep(1000);
      }
    }
  }
  /* Check for errors */
  if(response.getResponseCode()==200) {
    return JSON.parse(response.getContentText());
  } else {
    msg = response.getResponseCode()+' : There was a problem with your request to the API. Please verify your information and try again.\n\nResponse Message:\n'+response.getContentText();
    Logger.log(msg);
  }
  throw new Error(msg);
}

/********************************************************************************************
 * Attempts to request JSON data from the APIs.
 * @param {string} url - API 'Get' request
 * @return {array} The requested data as an object literal
*/
/* NOTE: This function does not appear to speed up the time taken to retrieve the data. */
Comlink.prototype.fetchAllAPI_ = function(payload = []){
  var response
  for(let tries=1; tries < 4; tries++){
    try{
      response = UrlFetchApp.fetchAll(payload);
      break;
    } catch(error) {
      if(tries === 3){
        throw new Error(error);
      }
      switch(tries){
        case 2:
          Utilities.sleep(2000);
          break;
        default:
          Utilities.sleep(1000);
      }      
    }  
  }
  var requested = [];
  /* Check for errors */
  var msg
  response.forEach(function(request){
      if(request.getResponseCode() == 200){
        requested.push(JSON.parse(request.getContentText()));
      } else {
          msg = request.getResponseCode()+' : There was a problem with your request to the API. Please verify your information and try again.\n\nResponse Message:\n'+request.getContentText();
        throw new Error(msg);
      }
    });
    return requested;  
}

/********************************************************************************************
 * Returns payload and parameters, used for creating fetchAll payloads.
 * @return {array} parameters - The request as an object
*/
Comlink.prototype.requestParameters_ = function(url, payload, methodType = "POST", accessKey = null, secretKey = null){
  let endpoint = url.substring(url.lastIndexOf("/"),url.length);
  let postHeader={};
  let parameters = {
    url: url,
    method: methodType,
    contentType: 'application/json',
    muteHttpExceptions: true
  };
  accessKey = (accessKey === null) ? this.accessKey : accessKey;
  secretKey = (secretKey === null) ? this.secretKey : secretKey;
  if(this.useHMAC && endpoint !== this.endpoint_enums && methodType !== "GET") {
    let requestTime = new Date().getTime().toString();
    this.getHMAC_(endpoint,payload,requestTime,secretKey);
    postHeader={
      'Authorization': `HMAC-SHA256 Credential=${accessKey},Signature=${this.hmacSignature}`,
      'X-Date': requestTime
    };
  }
  parameters["headers"] = postHeader;
  if(methodType === "POST"){
    parameters["payload"] = JSON.stringify(payload);
    parameters.headers["Accept-Encoding"] = "gzip, deflate";
  }
  return parameters;
}

/****************************************************************************
* Builds the needed HMAC signature for secured connections.
* @param {String} endpoint - The endpoint being posted to
* @payload {Object} payload - The request data as an object literal
* @payload {String} reqTime - The current time in Unix Epoch Time
*/
Comlink.prototype.getHMAC_ = function(endpoint,payload="{}",reqTime, secretKey = null) {
  var fields=[];
  fields.push(reqTime);
  fields.push("POST");
  fields.push(endpoint);

  secretKey = (secretKey === null) ? this.secretKey : secretKey;
  var bodyByte=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,JSON.stringify(payload));
  var bodyMessage=byteToString(bodyByte);
  fields.push(bodyMessage);
  var byteSignature=Utilities.computeHmacSha256Signature(fields.join(''),secretKey);
  this.hmacSignature=byteToString(byteSignature);
  return;

  // Convert bytes to string
  function byteToString(bytes) {
    return bytes.reduce(function(str,chr) {
      chr=(chr<0? chr+256:chr).toString(16);
      return str+(chr.length==1? '0':'')+chr;
    },'');
  }
}


/****************************************************************************
* Grabs the requested payload to use with the api request.
* @param {String} endpoint - The api endpoint to request data from
* @param {Integer} id - The allycode, playerId or guildId to get data for
* @param {Bool} enums - If the response should be in enums
* @param {Object} options - The additional request keys and modified values
*/
Comlink.prototype.getPayload_ = function(endpoint, id = null, enums = false, options = null){
  let payload = {};
  switch(endpoint){
    case "/metadata":
      return {
        "payload": {}
      };
    case "/enums":
      return {};
    case "/data":
      return {};
    case "/player": //and playerArena
      id = id.toString();
      if(id.length < 12){
        id = id.replace(/-/g,"");
        return {
          "payload": {
            "allyCode": id
          },
          "enums": enums
        };
      } else{
        return {
          "payload": {
            "playerId": id
          },
          "enums": enums
        };
      }
    case "/guild":
      return {
        "payload": {
          "guildId": id.toString(),
          "includeRecentGuildActivityInfo": true
        },
        "enums": enums
      };
    case "/getGuilds":
      if(options.name){
        payload = {
          "payload": {
            "filterType": 4,
            "count": (options.count) ? options.count : 10000,
            "name": options.name
          }
        }
      }else{
        payload = {
          "payload": {
            "filterType": 5,
            "count": (options.count) ? options.count : 10000,
            "searchCriteria": {
              "minMemberCount": (options.minMemberCount) ? options.minMemberCount : 1,
              "maxMemberCount": (options.maxMemberCount) ? options.maxMemberCount : 50,
              "minGuildGalacticPower": (options.minGuildGalacticPower) ? options.minGuildGalacticPower : 1,
              "maxGuildGalacticPower": (options.maxGuildGalacticPower) ? options.maxGuildGalacticPower : 999999999,
              "includeInviteOnly": true
            }
          }
        }
        payload["enums"] = enums;
        if(options.recentTbParticipatedIn){
          payload.payload.searchCriteria["recentTbParticipatedIn"] = options.recentTbParticipatedIn;
        }          
      }

      return payload;
    case "/getEvents":
      return {
        "enums": enums
      };
    case "/getLeaderboard":
      if(options.groupId){
        payload = {
          "payload": {
            "leaderboardType": 4,
            "eventInstanceId": "CHAMPIONSHIPS_GRAND_ARENA_GA2_EVENT_SEASON_36:O1676412000000",
            "groupId": "CHAMPIONSHIPS_GRAND_ARENA_GA2_EVENT_SEASON_36:O1676412000000:KYBER:100"
          },
        }
      }else{
        payload = {
          "payload": {
            "leaderboardType": 6,
            "league": 100,
            "division": 25
          },
        }
      }
      payload["enums"] = enums;
      return payload;
    case "/getGuildLeaderboard":
      payload = {
        "payload" : {
          "leaderboardId":[
            { 
              "leaderboardType": options.leaderboardType,
              "monthOffset": (options.monthOffset) ? options.monthOffset : 0
            }
          ],
          "count": (options.count) ? options.count : 200 
        }
      }
      payload["enums"] = enums;
      if(options.defId){
        payload.payload.leaderboardId[0]["defId"] = options.defId;
      }
      return payload;

    default:
      throw new Error("API ERROR:\nThe endpoint " + endpoint + "is not a valid endpoint.");
  }
}


/***************************************************************************
 * Returns the file name for the chosen localization
 * @param {String} language - The chosen language
 * @param {Boolean} useGithub - Optional: Flag to force the use of the github naming convention
 * @return {String} - The name of the file
 */
Comlink.prototype.getLangFileName_ = function(language){
  language = language.toUpperCase();
  var langOptions = {
    "CHS_CN": "Loc_CHS_CN.txt.json",
    "CHT_CN": "Loc_CHT_CN.txt.json",
    "ENG_US": "Loc_ENG_US.txt.json",
    "FRE_FR": "Loc_FRE_FR.txt.json",
    "GER_DE": "Loc_GER_DE.txt.json",
    "IND_ID": "Loc_IND_ID.txt.json",
    "ITA_IT": "Loc_ITA_IT.txt.json",
    "JPN_JP": "Loc_JPN_JP.txt.json",
    "KOR_KR": "Loc_KOR_KR.txt.json",
    "POR_BR": "Loc_POR_BR.txt.json",
    "RUS_RU": "Loc_RUS_RU.txt.json",
    "SPA_XM": "Loc_SPA_XM.txt.json",
    "THA_TH": "Loc_THA_TH.txt.json",
    "TUR_TR": "Loc_TUR_TR.txt.json"
  }
  return langOptions[language];
}


/***************************************************************************
 * Modifies the player object to standardize the structure and keys
 * @param {Object} rawData - The raw player profile
 */
Comlink.prototype.getBuiltPlayerData_ = function(rawPlayerData){
  const localization = this.fetchLocalization();
  const divisions = { 5: 5, 10: 4, 15: 3, 20: 2, 25: 1 };
  const statDefinitions = getStatDefinitions();
  if(this.gameData === null){ this.gameData = this.fetchData(["for_playerProfile"]); }
  var gameData = this.gameData;
  var isPercentValue = {1: false,5:false,28:false,41:false,42:false, 16: true, 17:true, 18:true, 48:true,49:true,52:true,53:true,54:true,55:true,56:true };

  //-->Build Maps to reduce iterations
  var unitMap = (this.unitMap === null) ? this.getMap_(gameData.units, "unitMap") : this.unitMap;
  var categoryMap = (this.categoryMap === null) ? this.getMap_(gameData.category, "categoryMap") : this.categoryMap;
  var skillMap = (this.skillMap === null) ? this.getMap_(gameData.skill, "skillMap") : this.skillMap;
  var targetMap = (this.targetMap === null) ? this.getMap_(gameData.battleTargetingRule, "targetMap") : this.targetMap;
  var datacronMap = (this.datacronMap === null) ? this.getMap_(gameData.datacronSet, "datacronMap") : this.datacronMap;
  var abilityMap = (this.abilityMap === null) ? this.getMap_(gameData.ability, "abilityMap") : this.abilityMap;
  var modMap = (this.modMap === null) ? this.getMap_(gameData.statMod, "modMap") : this.modMap;

  //-->Update and localize Profile data
  if(rawPlayerData.selectedPlayerTitle !== null){
    rawPlayerData.selectedPlayerTitle["nameKey"] = localization[rawPlayerData.selectedPlayerTitle.id + "_NAME"];
  }
  if(rawPlayerData.selectedPlayerPortrait !== null){
    rawPlayerData.selectedPlayerPortrait["nameKey"] = localization[rawPlayerData.selectedPlayerPortrait.id + "_TITLE"];
  }
  for(var i=0; i < rawPlayerData.profileStat.length; i++){
    rawPlayerData.profileStat[i]['name'] = localization[rawPlayerData.profileStat[i].nameKey];
  }
  /* Optional: Localizes all obtained portraits and titles*/
  for(var i=0; i < rawPlayerData.unlockedPlayerPortrait.length; i++){
    rawPlayerData.unlockedPlayerPortrait[i]["nameKey"] = localization[rawPlayerData.unlockedPlayerPortrait[i].id + "_TITLE"];
  }
  for(var i=0; i < rawPlayerData.unlockedPlayerTitle.length; i++){
    rawPlayerData.unlockedPlayerTitle[i].nameKey = localization[rawPlayerData.unlockedPlayerTitle[i].id + "_NAME"];
  }
  //*/

  //-->GAC and Squad Information
  for(var i=0; i < rawPlayerData.seasonStatus.length; i++){
    rawPlayerData.seasonStatus[i].division = divisions[rawPlayerData.seasonStatus[i].division];
  }
  if(rawPlayerData.playerRating.playerRankStatus !== null){
    rawPlayerData.playerRating.playerRankStatus.divisionId = divisions[rawPlayerData.playerRating.playerRankStatus.divisionId];
  }
  for(let a=0; a < 2; a ++){
    if(rawPlayerData.pvpProfile[a] !== undefined){
      for(let u=0; u < rawPlayerData.pvpProfile[a].squad.cell.length;u++){
        let unitIndx = unitMap[rawPlayerData.pvpProfile[a].squad.cell[u].unitDefId];
        let unit = gameData.units[unitIndx];
        rawPlayerData.pvpProfile[a].squad.cell[u]["defId"] = unit.baseId;
      }
    }
  }

  //-->Expand Datacron information
  for(var i=0; i < rawPlayerData.datacron.length;i++){
    let targetList = "";
    let cronIndx = datacronMap[rawPlayerData.datacron[i].setId];
    rawPlayerData.datacron[i]["setName"] = localization[ gameData.datacronSet[cronIndx].displayName ];
    rawPlayerData.datacron[i]["maxTier"] = rawPlayerData.datacron[i]["affix"].length;
    for(var t=0; t < rawPlayerData.datacron[i].affix.length; t++){
      if(rawPlayerData.datacron[i].affix[t].targetRule !== ""){
        let targetIndx = targetMap[rawPlayerData.datacron[i].affix[t].targetRule];
        let abilityIndx = abilityMap[rawPlayerData.datacron[i].affix[t].abilityId];
        let categoryIndx = categoryMap[ gameData.battleTargetingRule[targetIndx].category.category[0].categoryId ];
        let targetName = localization[gameData.category[categoryIndx].descKey];
        rawPlayerData.datacron[i].affix[t]["targetNameKey"] = targetName;
        rawPlayerData.datacron[i].affix[t]["abilityNameKey"] = localization[gameData.ability[abilityIndx].nameKey];
        rawPlayerData.datacron[i].affix[t]["abilityDescKey"] = localization[gameData.ability[abilityIndx].descKey].replace(/\{0\}/g,targetName);
      }else{
        rawPlayerData.datacron[i].affix[t]["targetNameKey"] = localization[statDefinitions[rawPlayerData.datacron[i].affix[t].statType].nameKey];
        rawPlayerData.datacron[i].affix[t]["statValue"] = rawPlayerData.datacron[i].affix[t]["statValue"] / 1e8;
        rawPlayerData.datacron[i].affix[t]["abilityNameKey"] = "";
        rawPlayerData.datacron[i].affix[t]["abilityDescKey"] = "";
      }
      switch(t){
        case 0:
          targetList = rawPlayerData.datacron[i].affix[t]["targetNameKey"];
          break;
        default:
          targetList += "," + rawPlayerData.datacron[i].affix[t]["targetNameKey"];
      }
    }
    rawPlayerData.datacron[i]["targetList"] = targetList;
  }

  //-->Expand Roster data
  for(var u=0; u < rawPlayerData.rosterUnit.length; u++ ){
    let unitIndx = unitMap[rawPlayerData.rosterUnit[u].definitionId];
    let unit = gameData.units[unitIndx];
    rawPlayerData.rosterUnit[u]["combatType"] = unit.combatType;
    rawPlayerData.rosterUnit[u]["isGalacticLegend"] = unit.legend;
    rawPlayerData.rosterUnit[u]["baseId"] = unit.baseId;
    rawPlayerData.rosterUnit[u]["defId"] = unit.baseId;
    rawPlayerData.rosterUnit[u]["name"] = localization[unit.nameKey];
    rawPlayerData.rosterUnit[u]["alignment"] = unit.forceAlignment;
    rawPlayerData.rosterUnit[u]["rarity"] = rawPlayerData.rosterUnit[u].currentRarity;
    rawPlayerData.rosterUnit[u]["level"] = rawPlayerData.rosterUnit[u].currentLevel;
    rawPlayerData.rosterUnit[u]["gear"] = rawPlayerData.rosterUnit[u].currentTier;
    //-->Get categories
    let catList = [];
    for(let c=0; c < unit.categoryId.length; c++){
      let catIndx = categoryMap[ unit.categoryId[c] ];
      if(gameData.category[catIndx].visible){
        catList.push(localization[gameData.category[catIndx].descKey]);
      }
    }
    rawPlayerData.rosterUnit[u]["categories"] = catList;
    //-->Get crew
    let crew = [];
    for(let c=0; c < unit.crew.length; c++){
      crew.push({ unitId: unit.crew[c].unitId, skillId: unit.crew[c].skillReference[0].skillId});
    }
    rawPlayerData.rosterUnit[u]["crew"] = crew;
    //-->Get skills
    let skillsList = [];
    let rosterSkillMap = [];
    rawPlayerData.rosterUnit[u].skill.forEach(function(skill){
      rosterSkillMap[skill.id] = skill.tier;
    });
    for(let s=0; s < unit.skillReference.length; s++){
      let skillIndx = skillMap[ unit.skillReference[s].skillId ];
      let skill = gameData.skill[skillIndx];
      let abIndx = abilityMap[skill.abilityReference];
      let zeta = false;
      let omicron = false;
      for(let t=0; t < skill.tier.length; t++){
        if(skill.tier[t].isZetaTier){
          if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+2)){
            zeta = true;
          }
        }
        if(skill.tier[t].isOmicronTier){
          if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+2)){
            omicron = true;
          }
        }
      }
      skillsList.push({
        id: skill.id,
        name: localization[gameData.ability[abIndx].nameKey],
        tier: (rosterSkillMap[skill.id] !== undefined) ? (rosterSkillMap[skill.id] + 2) : 1,
        maxTier: (skill.tier.length + 1),
        isZeta: skill.isZeta,
        isOmicron: (skill.omicronMode > 1 ) ? true : false,
        omicronArea: skill.omicronMode,
        hasZeta: zeta,
        hasOmicron: omicron
      });
    }
    for(let c=0; c < rawPlayerData.rosterUnit[u].crew.length; c++){
      let skillIndx = skillMap[ rawPlayerData.rosterUnit[u].crew[c].skillId ];
      let skill = gameData.skill[skillIndx];
      let abIndx = abilityMap[skill.abilityReference];
      let zeta = false;
      let omicron = false;
      for(let t=0; t < skill.tier.length; t++){
        if(skill.tier[t].isZetaTier){
          if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+2)){
            zeta = true;
          }
        }
        if(skill.tier[t].isOmicronTier){
          if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+2)){
            omicron = true;
          }
        }
      }
      skillsList.push({
        id: skill.id,
        name: localization[gameData.ability[abIndx].nameKey],
        tier: (rosterSkillMap[skill.id] !== undefined) ? (rosterSkillMap[skill.id] + 2) : 1,
        maxTier: (skill.tier.length + 1),
        isZeta: skill.isZeta,
        isOmicron: (skill.omicronMode > 1 ) ? true : false,
        omicronArea: skill.omicronMode,
        hasZeta: zeta,
        hasOmicron: omicron
      });
    }
    rawPlayerData.rosterUnit[u]["skills"] = skillsList;
    rawPlayerData.rosterUnit[u].skill = null;
    //rawPlayerData.rosterUnit[u]["equipped"] = rawPlayerData.rosterUnit[u].equipment.splice(0);

    //-->Get Mods
    let modSet = getModSetDefinitions();
    for(let m=0; m < rawPlayerData.rosterUnit[u].equippedStatMod.length;m++){
      let modIndx = modMap[rawPlayerData.rosterUnit[u].equippedStatMod[m].definitionId];
      rawPlayerData.rosterUnit[u].equippedStatMod[m]["slot"] = gameData.statMod[modIndx].slot;
      rawPlayerData.rosterUnit[u].equippedStatMod[m]["pips"] = gameData.statMod[modIndx].rarity;
      rawPlayerData.rosterUnit[u].equippedStatMod[m]["setId"] = gameData.statMod[modIndx].setId;
      rawPlayerData.rosterUnit[u].equippedStatMod[m]["setName"] = localization[ modSet[gameData.statMod[modIndx].setId].nameKey ];
      rawPlayerData.rosterUnit[u].equippedStatMod[m].primaryStat.stat["statName"] = localization[statDefinitions[rawPlayerData.rosterUnit[u].equippedStatMod[m].primaryStat.stat.unitStatId].nameKey];
      for(var ss=0; ss < rawPlayerData.rosterUnit[u].equippedStatMod[m].secondaryStat.length;ss++){
        rawPlayerData.rosterUnit[u].equippedStatMod[m].secondaryStat[ss].stat["statName"] = localization[statDefinitions[rawPlayerData.rosterUnit[u].equippedStatMod[m].secondaryStat[ss].stat.unitStatId].nameKey];
      }
    }
    rawPlayerData.rosterUnit[u]["mods"] = rawPlayerData.rosterUnit[u].equippedStatMod.map(function(mod){
      return {
          id: mod.id,
          level: mod.level,
          tier: mod.tier,
          pips: mod.pips,
          "set": Number(mod["setId"]),
          slot: mod.slot,
          primaryStat: {
            unitStat: mod.primaryStat.stat.unitStatId,
            value: (isPercentValue[mod.primaryStat.stat.unitStatId]) ? mod.primaryStat.stat.unscaledDecimalValue / 1000000 : mod.primaryStat.stat.unscaledDecimalValue / 100000000
          },
          secondaryStat: (mod.secondaryStat) ? mod.secondaryStat.map(function(secondary){
            return {
              unitStat: secondary.stat.unitStatId,
              value: (isPercentValue[secondary.stat.unitStatId]) ? secondary.stat.unscaledDecimalValue / 1000000 : secondary.stat.unscaledDecimalValue / 100000000,
              roll: secondary.roll.length,
              rollValues: secondary.roll
            }
          }) : []
        }
    });
  }
  //rawPlayerData["roster"] = rawPlayerData.rosterUnit.splice(0);
  //rawPlayerData.rosterUnit = null;
  return rawPlayerData;
}


/***************************************************************************
 * Modifies the player object to standardize structure and keys
 * @param {Object} rawData - The raw player profile
 */
Comlink.prototype.convertPlayerProfile_ = function(rawPlayerData){
  //Build initial object
  var newPlayerData = {
    "rosterUnit": [],
    "datacron": [],
    "seasonStatus": [],  //GG doesn't provide this
    "pvpProfile": [
      {
        tab: 1, //Squad
        rank: (rawPlayerData.data.arena === null) ? "" : rawPlayerData.data.arena.rank
      },
      {
        tab: 2, //Fleet
        rank: (rawPlayerData.data.fleet_arena === null) ? "" : rawPlayerData.data.fleet_arena.rank
      }
    ],
    "profileStat": [
      {
        "nameKey": "STAT_GALACTIC_POWER_ACQUIRED_NAME",
        value: rawPlayerData.data.galactic_power,
        "name": "Galactic Power:"
      },
      {
        "nameKey": "STAT_CHARACTER_GALACTIC_POWER_ACQUIRED_NAME",
        "value": rawPlayerData.data.character_galactic_power,
        "name": "Galactic Power (Characters):"
      },
      {
        "nameKey": "STAT_SHIP_GALACTIC_POWER_ACQUIRED_NAME",
        "value": rawPlayerData.data.ship_galactic_power,
        "name": "Galactic Power (Ships):"
      },
      {
        "nameKey": "STAT_PVP_SHIP_BATTLES_WIN_NAME",
        "value": rawPlayerData.data.ship_battles_won,
        "name": "Fleet Arena Battles Won:"
      },
      {
        "nameKey": "STAT_PVP_BATTLES_WIN_NAME_TU07_2",
        "value": rawPlayerData.data.pvp_battles_won,
        "name": "Squad Arena Battles Won:"
      },
      {
        "nameKey": "STAT_TOTAL_GALACTIC_WON_NAME_TU07_2",
        "value": rawPlayerData.data.galactic_war_won,
        "name": "Galactic War Battles Won:"
      },
      {
        "nameKey": "STAT_PVE_BATTLES_WIN_NAME_TU15",
        "value": rawPlayerData.data.pve_battles_won,
        "name": "Total Battles Won:"
      },
      {
        "nameKey": "STAT_PVE_HARD_BATTLES_WIN_NAME_TU07_2",
        "value": rawPlayerData.data.pve_hard_won,
        "name": "Hard Battles Won:"
      },
      {
        "nameKey": "STAT_GUILD_RAID_WON_NAME_TU07_2",
        value: rawPlayerData.data.guild_raid_won,
        "name": "Guild Raids Won:"
      },
      {
        "nameKey": "STAT_TOTAL_GUILD_CONTRIBUTION_NAME_TU07_2",
        "value": rawPlayerData.data.guild_contribution,
        "name": "Guild Tokens Earned:"
      },
      {
        "nameKey": "STAT_TOTAL_GUILD_EXCHANGE_DONATIONS_TU07_2",
        "value": rawPlayerData.data.guild_exchange_donations,
        "name": "Gear Donated in Guild Exchange:"
      },
      {
        "nameKey": "STAT_SEASON_SUCCESSFUL_DEFENDS_NAME",
        "value": rawPlayerData.data.season_successful_defends,
        "name": "Championship Successful Battle Defends:"
      },
      {
        "nameKey": "STAT_SEASON_FULL_CLEAR_ROUND_WINS_NAME",
        "value": rawPlayerData.data.season_full_clears,
        "name": "Championship Full Rounds Cleared:"
      },
      {
        "nameKey": "STAT_SEASON_LEAGUE_SCORE_NAME",
        "value": rawPlayerData.data.season_league_score,
        "name": "Lifetime Championship Score:"
      },
      {
        "nameKey": "STAT_SEASON_UNDERSIZED_SQUAD_WINS_NAME",
        "value": rawPlayerData.data.season_undersized_squad_wins,
        "name": "Championship Undersized Squad Battles Won:"
      },
      {
        "nameKey": "STAT_SEASON_PROMOTIONS_EARNED_NAME",
        "value": rawPlayerData.data.season_promotions_earned,
        "name": "Championship Promotions Earned:"
      },
      {
        "nameKey": "STAT_SEASON_BANNERS_EARNED_NAME",
        "value": rawPlayerData.data.season_banners_earned,
        "name": "Championship Banners Earned:"
      },
      {
        "nameKey": "STAT_SEASON_OFFENSIVE_BATTLES_WON_NAME",
        "value": rawPlayerData.data.season_offensive_battles_won,
        "name": "Championship Offensive Battles Won:"
      },
      {
        "nameKey": "STAT_SEASON_TERRITORIES_DEFEATED_NAME",
        "value": rawPlayerData.data.season_territories_defeated,
        "name": "Championship Territories Defeated:"
      }
    ],
    "playerRating": {
      "playerSkillRating": {
        "skillRating": (rawPlayerData.data.skill_rating === null) ? "" : rawPlayerData.data.skill_rating
      },
      "playerRankStatus": {
        "leagueId": (rawPlayerData.data.league_name === null) ? "" : rawPlayerData.data.league_name,
        "divisionId": (rawPlayerData.data.division_number === null) ? "" : rawPlayerData.data.division_number
      }
    },
    "name": rawPlayerData.data.name,
    "level": rawPlayerData.data.level,
    "allyCode": rawPlayerData.data.ally_code,
    "playerId": "",  //GG doesn't provide this
    "guildId": rawPlayerData.data.guild_id,
    "guildName": rawPlayerData.data.guild_name,
    "lastActivityTime": ""  //GG doesn't provide this
  }

  //Build Datacron data
  if(rawPlayerData.datacrons.length > 0){
    let datacronNames
    if(this.datacronMap === null){
      let datacronSetData = this.fetchAPI_("https://swgoh.gg/api/datacron-sets/","{}","GET");
      datacronNames = [];
      datacronSetData.forEach(cron => {
        datacronNames[cron.id] = cron.display_name;
      });
      this.datacronMap = datacronNames;
      if(this.gameData === null){
        this.gameData = { "datacrons": datacronSetData };
      } else if(!this.gameData.hasOwnProperty("datacrons")){
        this.gameData["datacrons"] = datacronSetData;
      }

    } else {
      datacronNames = this.datacronMap;
    }
    let targetList
    rawPlayerData.datacrons.forEach(cron => {
      targetList = [];
      cron.tiers.forEach(tier => {
        targetList.push(tier.scope_target_name);
      });
      targetList = targetList.toString();
      newPlayerData.datacron.push({
        "id": cron.id,
        "setId": cron.set_id,
        "templateId": cron.template_base_id,
        "locked": cron.locked,
        "rerollIndex": cron.reroll_index,
        "rerollCount": cron.reroll_count,
        "setName": datacronNames[cron.set_id],
        "maxTier": cron.tier,
        "targetList": targetList,
        "affix": cron.tiers.map(tier => {
          return {
            "targetRule": tier.target_rule_id,
            "abilityId": tier.ability_id,
            "statType": tier.stat_type,
            "statValue": tier.stat_value,
            "requiredUnitTier": tier.required_unit_tier,
            "requiredRelicTier": tier.required_relic_tier,
            "targetNameKey": tier.scope_target_name,
            "abilityNameKey": "", //GG doesn't have this or need it
            "abilityDescKey": tier.ability_description
          }
        })
      });
    });
  }

  //Build roster
  //Get unit data
  let unitMap, abilityMap
  if(this.unitMap === null){
    let unitData = this.fetchAPI_("https://swgoh.gg/api/units/","{}","GET");
    unitMap = [];
    for(let i=0; i < unitData.data.length; i++){
      unitMap[unitData.data[i].base_id] = i;
    }    
    this.unitMap = unitMap;
    if(this.gameData === null){
      this.gameData = { "units": unitData.data };
    } else if(!this.gameData.hasOwnProperty("units")){
      this.gameData["units"] = unitData.data;
    }
  } else {
    unitMap = this.unitMap;
  }
  //Get ability data
  if(this.abilityMap === null){
    let abilityData = this.fetchAPI_("https://swgoh.gg/api/abilities/","{}","GET");
    abilityMap = [];
    for(let i=0; i < abilityData.length; i++){
      abilityMap[abilityData[i].base_id] = i;
    }    
    this.abilityMap = abilityMap;
    if(this.gameData === null){
      this.gameData = { "ability": abilityData };
    } else if(!this.gameData.hasOwnProperty("ability")){
      this.gameData["ability"] = abilityData;
    }
  } else {
    abilityMap = this.abilityMap;
  }
  //Build mod data to units
  let modData = [];
  let flatValues = {1: true,5:true,28:true,41:true,42:true};
  rawPlayerData.mods.forEach(mod => {
    if(!modData.hasOwnProperty(mod.character)){ 
      modData[mod.character] = [];
    }
    modData[mod.character].push({
      "id": mod.id,
      "level": mod.level,
      "tier": mod.tier,
      "pips": mod.rarity,
      "set": mod["set"],
      "slot": (mod.slot + 1),
      "primaryStat": {
        "unitStat": mod.primary_stat.stat_id,
        "value": (flatValues[mod.primary_stat.stat_id]) ? mod.primary_stat.value / 10000 : mod.primary_stat.value / 100
      },
      "secondaryStat": mod.secondary_stats.map(function(ss) {
        return {
          "unitStat": ss.stat_id,
          "value": (flatValues[ss.stat_id]) ? ss.value / 10000 : ss.value / 100,
          "roll": ss.roll,
          "rollValues": ss.stat_rolls
        }
      })
    });
  });

  rawPlayerData.units.forEach(unit => {    
    newPlayerData.rosterUnit.push({
      "baseId": unit.data.base_id,
      "defId": unit.data.base_id,
      "name": unit.data.name,
      "alignment": this.gameData.units[unitMap[unit.data.base_id]].alignment,
      "rarity": unit.data.rarity,
      "currentRarity": unit.data.rarity,
      "level": unit.data.level,
      "currentLevel": unit.data.level,
      "gear": unit.data.gear_level,
      "currentTier": unit.data.gear_level,
      "relic": (unit.data.combat_type === 1) ? { currentTier: unit.data.relic_tier} : null,
      "isGalacticLegend": unit.data.is_galactic_legend,
      "combatType": unit.data.combat_type,
      "crew": (unit.data.combat_type === 2) ? this.gameData.units[unitMap[unit.data.base_id]].crew_base_ids.map(function(crew){
        return {
          "unitId": crew
        }
      }) : [],
      "purchasedAbilityId": (unit.data.has_ultimate) ? [ ("ultimateability_" + unit.data.base_id)] : [],
      "equipment": unit.data.gear.filter(gear => gear.is_obtained).map(function(gear){
        return {
          "slot": gear.slot,
          "equipmentId": gear.base_id
        }
      }),
      "categories": this.gameData.units[unitMap[unit.data.base_id]].categories,
      "skills": unit.data.ability_data.map(skill => {
        return {
          "id": skill.id,
          "name": skill.name,
          "tier": skill.ability_tier,
          "maxTier": skill.tier_max,
          "isZeta": skill.is_zeta,
          "isOmicron": skill.is_omicron,
          "omicronArea": this.gameData["ability"][abilityMap[skill.id]].omicron_mode,
          "hasZeta": skill.has_zeta_learned,
          "hasOmicron": skill.has_omicron_learned
        }
      }),
      "mods": modData[unit.data.base_id] || []
    });
  });
  return newPlayerData;
}


/*************************************************** 
 * Returns map of the designated data
 * @param {Object} data - The json file of the data to map
 * @param {String} property - The class property to add the map to
 * @return {Object} map - Returns a map of each data id with array index
 */
Comlink.prototype.getMap_ = function(data,property){
    let map = [];
    for(var i=0; i < data.length; i++){
      map[data[i].id] = i;
    }
    switch(property){
      case "unitMap":
        this.unitMap = map;
        break;
      case "categoryMap":
        this.categoryMap = map;
        break;
      case "skillMap":
        this.skillMap = map;
        break;
      case "targetMap":
        this.targetMap = map;
        break;
      case "datacronMap":
        this.datacronMap = map;
        break;
      case "abilityMap":
        this.abilityMap = map;
        break;
      case "modMap":
        this.modMap = map;
        break;
      default:
    }
    return map;
}

/**************************************************
 * Returns mod set names to help localize
 */
function getModSetDefinitions(){
  return {
    "1":{
      "setId":1,
      "nameKey":"UnitStat_Health",
      "name":"Health"
    },
    "2":{
      "setId":2,
      "nameKey":"UnitStat_Offense",
      "name":"Offense"
    },
    "3":{
      "setId":3,
      "nameKey":"UnitStat_Defense",
      "name":"Defense"
    },
    "4":{
      "setId":4,
      "nameKey":"UnitStat_Speed",
      "name":"Speed"
    },
    "5":{
      "setId":5,
      "nameKey":"UnitStat_CriticalRating",
      "name":"Critical Chance"
    },
    "6":{
      "setId":6,
      "nameKey":"UnitStat_CriticalDamage",
      "name":"Critical Damage"
    },
    "7":{
      "setId":7,
      "nameKey":"UnitStat_Accuracy",
      "name":"Potency"
    },
    "8":{
      "setId":8,
      "nameKey":"UnitStat_Resistance",
      "name":"Tenacity"
    }
  }
}

/*********************************************
 * Returns object with details on stats
 */
function getStatDefinitions(){
  return {
    "1":{
      "statId":1,
      "nameKey":"UnitStat_Health",
      "descKey":"UnitStatDescription_Health_TU7",
      "isDecimal":false,
      "name":"Health",
      "detailedName":"Max Health"
    },
    "2":{
      "statId":2,
      "nameKey":"UnitStat_Strength",
      "descKey":"UnitStatDescription_Strength",
      "isDecimal":false,
      "name":"Strength",
      "detailedName":"Strength"
    },
    "3":{
      "statId":3,
      "nameKey":"UnitStat_Agility",
      "descKey":"UnitStatDescription_Agility",
      "isDecimal":false,
      "name":"Agility",
      "detailedName":"Agility"
    },
    "4":{
      "statId":4,
      "nameKey":"UnitStat_Intelligence_TU7",
      "descKey":"UnitStatDescription_Intelligence",
      "isDecimal":false,
      "name":"Tactics",
      "detailedName":"Tactics"
    },
    "5":{
      "statId":5,
      "nameKey":"UnitStat_Speed",
      "descKey":"UnitStatDescription_Speed",
      "isDecimal":false,
      "name":"Speed",
      "detailedName":"Speed"
    },
    "6":{
      "statId":6,
      "nameKey":"UnitStat_AttackDamage",
      "descKey":"UnitStatDescription_AttackDamage",
      "isDecimal":false,
      "name":"Physical Damage",
      "detailedName":"Physical Damage"
    },
    "7":{
      "statId":7,
      "nameKey":"UnitStat_AbilityPower",
      "descKey":"UnitStatDescription_AbilityPower",
      "isDecimal":false,
      "name":"Special Damage",
      "detailedName":"Special Damage"
    },
    "8":{
      "statId":8,
      "nameKey":"UnitStat_Armor",
      "descKey":"UnitStatDescription_Armor",
      "isDecimal":false,
      "name":"Armor",
      "detailedName":"Armor"
    },
    "9":{
      "statId":9,
      "nameKey":"UnitStat_Suppression",
      "descKey":"UnitStatDescription_Suppression",
      "isDecimal":false,
      "name":"Resistance",
      "detailedName":"Resistance"
    },
    "10":{
      "statId":10,
      "nameKey":"UnitStat_ArmorPenetration",
      "descKey":"UnitStatDescription_ArmorPenetration",
      "isDecimal":false,
      "name":"Armor Penetration",
      "detailedName":"Armor Penetration"
    },
    "11":{
      "statId":11,
      "nameKey":"UnitStat_SuppressionPenetration",
      "descKey":"UnitStatDescription_SuppressionPenetration",
      "isDecimal":false,
      "name":"Resistance Penetration",
      "detailedName":"Resistance Penetration"
    },
    "12":{
      "statId":12,
      "nameKey":"UnitStat_DodgeRating_TU5V",
      "descKey":"UnitStatDescription_DodgeRating",
      "isDecimal":false,
      "name":"Dodge Chance",
      "detailedName":"Dodge Rating"
    },
    "13":{
      "statId":13,
      "nameKey":"UnitStat_DeflectionRating_TU5V",
      "descKey":"UnitStatDescription_DeflectionRating",
      "isDecimal":false,
      "name":"Deflection Chance",
      "detailedName":"Deflection Rating"
    },
    "14":{
      "statId":14,
      "nameKey":"UnitStat_AttackCriticalRating_TU5V",
      "descKey":"UnitStatDescription_AttackCriticalRating",
      "isDecimal":false,
      "name":"Physical Critical Chance",
      "detailedName":"Physical Critical Rating"
    },
    "15":{
      "statId":15,
      "nameKey":"UnitStat_AbilityCriticalRating_TU5V",
      "descKey":"UnitStatDescription_AbilityCriticalRating",
      "isDecimal":false,
      "name":"Special Critical Chance",
      "detailedName":"Special Critical Rating"
    },
    "16":{
      "statId":16,
      "nameKey":"UnitStat_CriticalDamage",
      "descKey":"UnitStatDescription_CriticalDamage",
      "isDecimal":true,
      "name":"Critical Damage",
      "detailedName":"Critical Damage"
    },
    "17":{
      "statId":17,
      "nameKey":"UnitStat_Accuracy",
      "descKey":"UnitStatDescription_Accuracy",
      "isDecimal":true,
      "name":"Potency",
      "detailedName":"Potency"
    },
    "18":{
      "statId":18,
      "nameKey":"UnitStat_Resistance",
      "descKey":"UnitStatDescription_Resistance",
      "isDecimal":true,
      "name":"Tenacity",
      "detailedName":"Tenacity"
    },
    "19":{
      "statId":19,
      "nameKey":"UnitStat_DodgePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Dodge",
      "detailedName":"Dodge Percent Additive"
    },
    "20":{
      "statId":20,
      "nameKey":"UnitStat_DeflectionPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Deflection",
      "detailedName":"Deflection Percent Additive"
    },
    "21":{
      "statId":21,
      "nameKey":"UnitStat_AttackCriticalPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Physical Critical Chance",
      "detailedName":"Physical Critical Percent Additive"
    },
    "22":{
      "statId":22,
      "nameKey":"UnitStat_AbilityCriticalPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Special Critical Chance",
      "detailedName":"Special Critical Percent Additive"
    },
    "23":{
      "statId":23,
      "nameKey":"UnitStat_ArmorPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Armor",
      "detailedName":"Armor Percent Additive"
    },
    "24":{
      "statId":24,
      "nameKey":"UnitStat_SuppressionPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Resistance",
      "detailedName":"Resistance Percent Additive"
    },
    "25":{
      "statId":25,
      "nameKey":"UnitStat_ArmorPenetrationPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Armor Penetration",
      "detailedName":"Armor Penetration Percent Additive"
    },
    "26":{
      "statId":26,
      "nameKey":"UnitStat_SuppressionPenetrationPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Resistance Penetration",
      "detailedName":"Resistance Penetration Percent Additive"
    },
    "27":{
      "statId":27,
      "nameKey":"UnitStat_HealthSteal",
      "descKey":"UnitStatDescription_HealthSteal",
      "isDecimal":true,
      "name":"Health Steal",
      "detailedName":"Health Steal"
    },
    "28":{
      "statId":28,
      "nameKey":"UnitStat_MaxShield",
      "descKey":"UnitStatDescription_MaxShield",
      "isDecimal":false,
      "name":"Protection",
      "detailedName":"Max Protection"
    },
    "29":{
      "statId":29,
      "nameKey":"UnitStat_ShieldPenetration",
      "descKey":"",
      "isDecimal":true,
      "name":"Protection Ignore",
      "detailedName":"Protection Ignore"
    },
    "30":{
      "statId":30,
      "nameKey":"UnitStat_HealthRegen",
      "descKey":"",
      "isDecimal":true,
      "name":"Health Regeneration",
      "detailedName":"Health Regen"
    },
    "31":{
      "statId":31,
      "nameKey":"UnitStat_AttackDamagePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Physical Damage",
      "detailedName":"Physical Damage Percent Additive"
    },
    "32":{
      "statId":32,
      "nameKey":"UnitStat_AbilityPowerPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Special Damage",
      "detailedName":"Special Damage Percent Additive"
    },
    "33":{
      "statId":33,
      "nameKey":"UnitStat_DodgeNegatePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Physical Accuracy",
      "detailedName":"Dodge Negate Percent Additive"
    },
    "34":{
      "statId":34,
      "nameKey":"UnitStat_DeflectionNegatePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Special Accuracy",
      "detailedName":"Deflection Negate Percent Additive"
    },
    "35":{
      "statId":35,
      "nameKey":"UnitStat_AttackCriticalNegatePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Physical Critical Avoidance",
      "detailedName":"Physical Critical Negate Percent Additive"
    },
    "36":{
      "statId":36,
      "nameKey":"UnitStat_AbilityCriticalNegatePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Special Critical Avoidance",
      "detailedName":"Special Critical Negate Percent Additive"
    },
    "37":{
      "statId":37,
      "nameKey":"UnitStat_DodgeNegateRating",
      "descKey":"UnitStatDescription_DodgeNegateRating",
      "isDecimal":false,
      "name":"Physical Accuracy",
      "detailedName":"Dodge Negate Rating"
    },
    "38":{
      "statId":38,
      "nameKey":"UnitStat_DeflectionNegateRating",
      "descKey":"UnitStatDescription_DeflectionNegateRating",
      "isDecimal":false,
      "name":"Special Accuracy",
      "detailedName":"Deflection Negate Rating"
    },
    "39":{
      "statId":39,
      "nameKey":"UnitStat_AttackCriticalNegateRating",
      "descKey":"UnitStatDescription_AttackCriticalNegateRating",
      "isDecimal":false,
      "name":"Physical Critical Avoidance",
      "detailedName":"Physical Critical Negate Rating"
    },
    "40":{
      "statId":40,
      "nameKey":"UnitStat_AbilityCriticalNegateRating",
      "descKey":"UnitStatDescription_AbilityCriticalNegateRating",
      "isDecimal":false,
      "name":"Special Critical Avoidance",
      "detailedName":"Special Critical Negate Rating" 
    },
    "41":{
      "statId":41,
      "nameKey":"UnitStat_Offense",
      "descKey":"UnitStatDescription_Offense",
      "isDecimal":false,
      "name":"Offense",
      "detailedName":"Offense"
    },
    "42":{
      "statId":42,
      "nameKey":"UnitStat_Defense",
      "descKey":"UnitStatDescription_Defense",
      "isDecimal":false,
      "name":"Defense",
      "detailedName":"Defense"
    },
    "43":{
      "statId":43,
      "nameKey":"UnitStat_DefensePenetration",
      "descKey":"UnitStatDescription_DefensePenetration",
      "isDecimal":false,
      "name":"Defense Penetration",
      "detailedName":"Defense Penetration"
    },
    "44":{
      "statId":44,
      "nameKey":"UnitStat_EvasionRating",
      "descKey":"UnitStatDescription_EvasionRating",
      "isDecimal":false,
      "name":"Evasion",
      "detailedName":"Evasion Rating"
    },
    "45":{
      "statId":45,
      "nameKey":"UnitStat_CriticalRating",
      "descKey":"UnitStatDescription_CriticalRating",
      "isDecimal":false,
      "name":"Critical Chance",
      "detailedName":"Critical Rating"
    },
    "46":{
      "statId":46,
      "nameKey":"UnitStat_EvasionNegateRating",
      "descKey":"UnitStatDescription_EvasionNegateRating",
      "isDecimal":false,
      "name":"Accuracy",
      "detailedName":"Evasion Negate Rating"
    },
    "47":{
      "statId":47,
      "nameKey":"UnitStat_CriticalNegateRating",
      "descKey":"UnitStatDescription_CriticalNegateRating",
      "isDecimal":false,
      "name":"Critical Avoidance",
      "detailedName":"Critical Negate Rating"
    },
    "48":{
      "statId":48,
      "nameKey":"UnitStat_OffensePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Offense",
      "detailedName":"Offense Percent Additive"
    },
    "49":{
      "statId":49,
      "nameKey":"UnitStat_DefensePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Defense",
      "detailedName":"Defense Percent Additive"
    },
    "50":{
      "statId":50,
      "nameKey":"UnitStat_DefensePenetrationPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Defense Penetration",
      "detailedName":"Defense Penetration Percent Additive"
    },
    "51":{
      "statId":51,
      "nameKey":"UnitStat_EvasionPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Evasion",
      "detailedName":"Evasion Percent Additive"
    },
    "52":{
      "statId":52,
      "nameKey":"UnitStat_EvasionNegatePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Accuracy",
      "detailedName":"Evasion Negate Percent Additive"
    },
    "53":{
      "statId":53,
      "nameKey":"UnitStat_CriticalChancePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Critical Chance",
      "detailedName":"Critical Chance Percent Additive"
    },
    "54":{
      "statId":54,
      "nameKey":"UnitStat_CriticalNegateChancePercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Critical Avoidance",
      "detailedName":"Critical Negate Chance Percent Additive"
    },
    "55":{
      "statId":55,
      "nameKey":"UnitStat_MaxHealthPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Health",
      "detailedName":"Max Health Percent Additive"
    },
    "56":{
      "statId":56,
      "nameKey":"UnitStat_MaxShieldPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Protection",
      "detailedName":"Max Protection Percent Additive"
    },
    "57":{
      "statId":57,
      "nameKey":"UnitStat_SpeedPercentAdditive",
      "descKey":"",
      "isDecimal":true,
      "name":"Speed",
      "detailedName":"Speed Percent Additive"},
    "58":{
      "statId":58,
      "nameKey":"UnitStat_CounterAttackRating",
      "descKey":"",
      "isDecimal":true,
      "name":"Counter Attack",
      "detailedName":"Counter Attack Rating"
    },
    "59":{
      "statId":59,
      "nameKey":"Combat_Buffs_TASK_NAME_2",
      "descKey":"",
      "isDecimal":true,
      "name":"Taunt",
      "detailedName":"Taunt"
    },
    "60":{
      "statId":60,
      "nameKey":"UnitStat_DefensePenetrationTargetPercentAdditive",
      "descKey":"UnitStatDescription_DefensePenetrationTargetPercentAdditive",
      "isDecimal":true,
      "name":"Defense Penetration",
      "detailedName":"Target Defense Penetration Percent Additive"
    },
    "61":{
      "statId":61,
      "nameKey":"UNIT_STAT_STAT_VIEW_MASTERY",
      "descKey":"",
      "isDecimal":true,
      "name":"Mastery",
      "detailedName":"Mastery"
    }
  }
}

