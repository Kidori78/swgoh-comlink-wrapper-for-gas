/**
 * @Class ComlinkAPI
 * 
*/
class ComlinkAPI {
  /**
    * ComlinkAPI is a client wrapper for SWGOH Comlink API to make connecting and requesting information from it easier.
    *
    * Available Methods
    * - .fetchPlayer()
    * - .fetchData()
    * - .fetchEnums()
    * - .fetchLocalization()
    * - .fetchGuild()
    * - .getModSetDefinitions()
    * - .getStatDefinitions()
    * 
    * @param {String} host - The full web address where Comlink is w/out the forward slash at the end.
    * @param {String} accessKey - Optional: The public key required if HMAC has been enabled for Comlink connections
    * @param {String} secretKey - Optional: The private key required if HMAC has been enabled for Comlink connections
  */
  constructor(host, accessKey = null, secretKey = null, language = "ENG_US") {
    //-->Endpoints
    const url =`${host}`;
    this.url_data =`${url}/data`;
    this.url_player =`${url}/player`;
    this.url_guild =`${url}/guild`;
    this.url_metadata =`${url}/metadata`;
    this.url_localization =`${url}/localization`;
    this.url_enums =`${url}/enums`;
    this.endpoint_player ="/player";
    this.endpoint_guild ="/guild";
    this.endpoint_data ="/data";
    this.endpoint_metadata ="/metadata";
    this.endpoint_localization ="/localization";
    this.endpoint_enums ="/enums";
    this.usingGithub = (host.indexOf('github') > -1) ? true : false;
    //-->Security settings
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.hmacSignature;
    this.useHMAC=false;
    if(this.accessKey !== null && this.secretKey !== null) {
      this.useHMAC=true;
    }
    //-->Data Versions
    this.version = {game:"",localization:""};
    if(!this.usingGithub){
      this.version = this.getVersions_(this.url_metadata,this.endpoint_metadata);
    }
    this.gameVersion = this.version.game;
    //-->Localization
    this.localizationVersion = this.version.localization;
    const langOptions = {
      "CHS_CN": (this.usingGithub) ? "CHS_CN.txt" : "Loc_CHS_CN.txt",
      "CHT_CN": (this.usingGithub) ? "CHT_CN.txt" : "Loc_CHT_CN.txt",
      "ENG_US": (this.usingGithub) ? "ENG_US.txt" : "Loc_ENG_US.txt",
      "FRE_FR": (this.usingGithub) ? "FRE_FR.txt" : "Loc_FRE_FR.txt",
      "GER_DE": (this.usingGithub) ? "GER_DE.txt" : "Loc_GER_DE.txt",
      "IND_ID": (this.usingGithub) ? "IND_ID.txt" : "Loc_IND_ID.txt",
      "ITA_IT": (this.usingGithub) ? "ITA_IT.txt" : "Loc_ITA_IT.txt",
      "JPN_JP": (this.usingGithub) ? "JPN_JP.txt" : "Loc_JPN_JP.txt",
      "KOR_KR": (this.usingGithub) ? "KOR_KR.txt" : "Loc_KOR_KR.txt",
      "POR_BR": (this.usingGithub) ? "POR_BR.txt" : "Loc_POR_BR.txt",
      "RUS_RU": (this.usingGithub) ? "RUS_RU.txt" : "Loc_RUS_RU.txt",
      "SPA_XM": (this.usingGithub) ? "SPA_XM.txt" : "Loc_SPA_XM.txt",
      "THA_TH": (this.usingGithub) ? "THA_TH.txt" : "Loc_THA_TH.txt",
      "TUR_TR": (this.usingGithub) ? "TUR_TR.txt" : "Loc_TUR_TR.txt"
    }
    this.language = langOptions[language];
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
   * @param {Integer} allyCode - The player's ally code to retrieve data for
   * @param {Bool} enums - Optional: Flag to return enum values in the response
   * @param {Bool} preBuild - Optional: Flag to return response with additional data that is all localized
   * @returns {Object} rawData - Returns the requested player profile in json format
  */
  fetchPlayer(allyCode, enums = false, preBuild = false){
    var rawData
    if(this.usingGithub){
      this.url_player = this.url_player + "/player.json";
      rawData = this.fetchAPI_(this.url_player, "{}", null, "GET")
    }else{
      rawData = this.fetchAPI_(this.url_player,this.getPayload_(this.endpoint_player,allyCode, null, enums), this.endpoint_player);
    }
    
    if(!preBuild){
      return rawData;
    }else{
      let builtData = this.getBuiltPlayerData_(rawData);
      return builtData;
    }
  }
  

  /************************************************************
   * Returns the specified guild player profiles from the api.
   * @param {Integer} allyCode - The player's ally code to retrieve guild data for
   * @param {Bool} enums - Optional: Flag to return enum values in the response
   * @param {Bool} preBuild - Optional: Flag to return response with additional data that is all localized
   * @returns {Object} rawData - Returns the requested guild profiles in json format
  */
  fetchGuild(allyCode, enums = false, preBuild = false){
    var rawData = [];
    if(this.usingGithub){
      let segment
      let response = [];
      for(var seg = 1; seg < 6; seg++){
        segment = "guild" + seg + ".json";
        response = this.fetchAPI_(this.url_guild + "/" + segment, "{}", null, "GET");
        for(var p=0; p < response.length; p++){
          if(!preBuild){
            rawData.push(response[p]);
          }else{
            rawData.push(this.getBuiltPlayerData_(response[p]));
          }

        }
      }
    }else{
      //Comlink currently does not offer this and you have to use the fetchPlayer for each ally code.
    }
    return rawData;
  }


  /************************************************************
   * Returns the game data collections
   * @param {Array} collections - An array of specified collection names
   * - Accepts all collection names found at https://gitlab.com/swgoh-tools/swgoh-comlink/-/wikis/Game-Data
   * - Also accepts the following named groups
   * - "for_gameData" = collections required for building gameData.json
   * - "for_conquest" - collections related to conquest
   * - "for_abilities" - collections related to unit abilities
   * - "for_territoryBattles" - collections related to Territory Battles
   * - "for_playerProfile" - all collections used to expand player data
   * _ "for_datacrons" - collections related to Datacrons
   * - "for_grandArena" - collections related to Grand Arena
   * @returns {Object} rawData - Returns the requested collections in json format
  */
  fetchData(collections = []){
    let requestedData = [];
    let allData = [];
    let getCollections = [];
    let searchAll = false;
    let reqSegments = [];
    let segmentMap = this.getSegmentDetails_();

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
            tempColl = ["ability","recipe","skill","units"];
            break;
          case "for_territoryBattles":
            tempColl = ["campaign","mysteryBox","equipment","material","table","territoryBattleDefinition","ability","units","category"];
            break;
          case "for_playerProfile":
            tempColl = ["units","category","skill","statMod","battleTargetingRule", "datacronSet","ability"];
            break;
          case "for_datacrons":
            tempColl = ["datacronSet","datacronTemplate","datacronAffixTemplateSet"];
            break;
          case "for_grandArena":
            tempColl = ["seasonDefinition","seasonRewardTable","territoryTournamentDailyRewardTable","territoryTournamentDefinition","territoryTournamentDivisionDefinition","territoryTournamentLeagueDefinition"];
            break;
          default:
            throw new Error("ERROR: COLLECTION NOT FOUND\nThe collect group specified does not exist.");
        }

        //-->Find segment to grab or flag to search through all
        tempColl.forEach(function(coll){
          if(getCollections[coll] === undefined){
            getCollections[coll] = coll
            if(segmentMap[coll] !== undefined){
              reqSegments[segmentMap[coll]] = segmentMap[coll];
            }else{
              searchAll = true;
            }
          }
        });
      }else{
        getCollections[collection] = collection;
        if(segmentMap[collection] !== undefined){
          reqSegments[segmentMap[collection]] = segmentMap[collection];
        }else{
          searchAll = true;
        }
      }
    });

    //-->Fetch all of the data from the api
    if(!this.usingGithub){
      let response = [];
      if(searchAll){
        for(var seg=1; seg < 99; seg++){
          try{
            response = this.fetchAPI_(this.url_data,this.getPayload_(this.endpoint_data,null, seg), this.endpoint_data);
            allData.push(response[0]);
          }catch(e){
            break;
          }
        }
      }else{
        for(const segment in reqSegments){
          response = this.fetchAPI_(this.url_data,this.getPayload_(this.endpoint_data,null, reqSegments[segment]), this.endpoint_data);
          if(allData["ability"] === undefined){
            allData = response;
          }else{
            for(const col in response){
              if(response[col] !== null && response[col].length > 0){
                allData[col] = response[col];
              }
            }
          }
        }
      }
    }else{
      for(const col in getCollections){
        allData[col] = this.fetchAPI_(this.url_data + "/" + col + ".json", "{}", null, "GET");
      }
    }

    //-->Build array to return only including the needed data
    for(const col in getCollections){
      requestedData[col] = allData[col];
    }
    return requestedData;
  }


/************************************************************
   * Returns the enums used for the game data
  */
  fetchEnums(){
    var rawData = [];
    if(!this.usingGithub){
      rawData = this.fetchAPI_(this.url_enums,this.getPayload_(this.endpoint_enums), this.endpoint_enums,"GET");
    }
    return rawData;
  }


/************************************************************
   * Returns the localization for the game data
   * @param {String} language - The ISO 639 language code and ISO 3166 country code for the language. Default is "ENG_US" 
  */
  fetchLocalization(language = this.language){
    if(this.localization !== null){ return this.localization }
    var localization = [];
    var langData = [];
    if(this.usingGithub){
      langData[language] = this.fetchAPI_(this.url_localization + "/" + language, "{}", "/localization", "GET");
    }else{
      let rawZip = this.fetchAPI_(this.url_localization,this.getPayload_(this.endpoint_localization),this.endpoint_localization);
      let zippedFile = Utilities.base64Decode(rawZip); 
      let unZippedFile = Utilities.unzip(zippedFile);
      rawZip = null;
      zippedFile = null;
      unZippedFile.forEach(function(contents){
        if(contents.getContentType() === "application/json"){
          langData[language] = JSON.parse(contents.getDataAsString())[language];
        }else{
          if(contents.getName() === language){
            langData[contents.getName()] = contents.getDataAsString();
          }
        }
      });
    }

    let tempLoc = langData[language].split("\n");
    tempLoc.forEach(function(id){
      let pos = id.indexOf("|");
      if(pos > -1){
        let key = id.substring(0, pos);
        let val = id.substring(pos+1,id.length);
        localization[key] = val;
      }
    });
    this.localization = localization;
    return localization;
  }


  /**************************************************
    * Attempts to request JSON data from the APIs.
    * @param {String} url - Full web address of Comlink including endpoint
    * @param {Object} payload - The requested data as an object literal
    * @param {String} endpoint - The endpoint being posted to
    * @param {String} methodType - The type of method to get the request in: Default is "POST"
  */
  fetchAPI_(url,payload,endpoint, methodType = "POST") {
    let parameters;
    let postHeader={};
    parameters={
      method: methodType,
      contentType: 'application/json',
      muteHttpExceptions: true
    };
    if(this.useHMAC && endpoint !== this.endpoint_enums && !this.usingGithub) {
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
    }
    let response = UrlFetchApp.fetch(url,parameters);
    /* Check for errors */
    if(response.getResponseCode()==200) {
      if(endpoint === "/localization"){
        if(this.usingGithub){
          return response.getContentText();
        }else{
          return response.getBlob();
        }
      }else{
        return JSON.parse(response.getContentText());
      }
    }
    else {
      throw new Error(response.getResponseCode()+' : There was a problem with your request to the API. Please verify your information and try again.\n\nResponse Message:\n'+response.getContentText());
    }
  }

  /****************************************************************************
  * Builds the needed HMAC signature for secured connections.
  * @param {String} endpoint - The endpoint being posted to
  * @payload {Object} payload - The request data as an object literal
  * @payload {String} reqTime - The current time in Unix Epoch Time
  */
  getHMAC_(endpoint,payload="{}",reqTime) {
    var fields=[];
    fields.push(reqTime);
    fields.push("POST");
    fields.push(endpoint);

    var bodyByte=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,JSON.stringify(payload));
    var bodyMessage=byteToString(bodyByte);
    fields.push(bodyMessage);
    var byteSignature=Utilities.computeHmacSha256Signature(fields.join(''),this.secretKey);
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
  * Grabs the cached game and localization versions or requests them if expired.
  * @param {String} url - The full web addrss with endpoint
  * @payload {String} endpoint - The api endpoint to request data from
  */
  getVersions_(url, endpoint) {
    const cache = CacheService.getScriptCache();
    if(!cache.get("gameVer")){
      this.initializeVersion_(url,endpoint);
    }
    let gameVer = cache.get("gameVer");
    let langVer = cache.get("langVer");
    return {"game": gameVer, "localization": langVer};
  }


 /****************************************************************************
  * Gets the current game and localization versions and caches them.
  * @param {String} url - The full web addrss with endpoint
  * @payload {String} endpoint - The api endpoint to request data from
  */
  initializeVersion_(url,endpoint){
    const metadata = this.fetchAPI_(url,this.getPayload_(endpoint), endpoint);
    let ver = { "game": metadata.latestGamedataVersion, "localization": metadata.latestLocalizationBundleVersion };
    const seconds = 3600; //max 21600 (6 hr)
    const cache = CacheService.getScriptCache();
    cache.put("gameVer", ver.game, seconds);
    cache.put("langVer", ver.localization, seconds);
  }


 /****************************************************************************
  * Grabs the requested payload to use with the api request.
  * @param {String} endpoint - The api endpoint to request data from
  * @param {Integer} allyCode - The player's ally code to get data for
  * @param {Integer} segment - The data segment to request
  * @param {Bool} enums - If the response should be in enums
  */
  getPayload_(endpoint, allyCode = null, segment = null, enums = false){
    switch(endpoint){
      case "/metadata":
        return {
          "payload": {}
        };
      case "/localization":
        return {
          "payload": {
            "id": this.localizationVersion
          },
          "unzip": false
        };
      case "/enums":
        return {};
      case "/data":
        return {
          "payload": {
              "version": this.gameVersion,
              "includePveUnits": false,
              "requestSegment": segment
          },
          "enums": enums
        };
      case "/player":
        return {
          "payload": {
            "allyCode": allyCode.toString()
          },
          "enums": enums
        };
      default:
        throw new Error("API ERROR:\nThe endpoint " + endpoint + "is not a valid endpoint.");
    }
  }


  /***************************************************************************
   * Returns an object with the segment location for each collection
   * @param {Object} rawData - The raw player profile
   */
  getBuiltPlayerData_(rawPlayerData){
    const localization = this.fetchLocalization();
    const divisions = { 5: 5, 10: 4, 15: 3, 20: 2, 25: 1 };
    const statDefinitions = this.getStatDefinitions();
    if(this.gameData === null){ this.gameData = this.fetchData(["for_playerProfile"]); }
    var gameData = this.gameData;
    

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
      rawPlayerData.selectedPlayerTitle.id = localization[rawPlayerData.selectedPlayerTitle.id + "_NAME"];
    }
    if(rawPlayerData.selectedPlayerPortrait !== null){
      rawPlayerData.selectedPlayerPortrait["nameKey"] = localization[rawPlayerData.selectedPlayerPortrait.id + "_TITLE"];
    }
    for(var i=0; i < rawPlayerData.profileStat.length; i++){
      rawPlayerData.profileStat[i].nameKey = localization[rawPlayerData.profileStat[i].nameKey];
    }
    /* Optional: Localizes all obtained portraits and titles*/
    for(var i=0; i < rawPlayerData.unlockedPlayerPortrait.length; i++){
      rawPlayerData.unlockedPlayerPortrait[i]["id"] = localization[rawPlayerData.unlockedPlayerPortrait[i].id + "_TITLE"];
    }
    for(var i=0; i < rawPlayerData.unlockedPlayerTitle.length; i++){
      rawPlayerData.unlockedPlayerTitle[i].nameKey = localization[rawPlayerData.unlockedPlayerTitle[i].id + "_NAME"];
    }
    //*/

    //-->GAC Information
    for(var i=0; i < rawPlayerData.seasonStatus.length; i++){
      rawPlayerData.seasonStatus[i].division = divisions[rawPlayerData.seasonStatus[i].division];
    }
    rawPlayerData.playerRating.playerRankStatus.divisionId = divisions[rawPlayerData.playerRating.playerRankStatus.divisionId];

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
          rawPlayerData.datacron[i].affix[t]["abilityDescKey"] = localization[gameData.ability[abilityIndx].descKey].replace("{0}",targetName);
        }else{
          rawPlayerData.datacron[i].affix[t]["targetNameKey"] = localization[statDefinitions[rawPlayerData.datacron[i].affix[t].statType].nameKey]
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
      rawPlayerData.rosterUnit[u]["name"] = localization[unit.nameKey];
      rawPlayerData.rosterUnit[u]["alignment"] = unit.forceAlignment;
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
        let zeta = false;
        let omicron = false;
        for(let t=0; t < skill.tier.length; t++){
          if(skill.tier[t].isZetaTier){
            if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+1)){
              zeta = true;
            }
          }
          if(skill.tier[t].isOmicronTier){
            if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+1)){
              omicron = true;
            }
          }
        }
        skillsList.push({
          id: skill.id,
          currentTier: (rosterSkillMap[skill.id] + 2) || 1,
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
        let zeta = false;
        let omicron = false;
        for(let t=0; t < skill.tier.length; t++){
          if(skill.tier[t].isZetaTier){
            if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+1)){
              zeta = true;
            }
          }
          if(skill.tier[t].isOmicronTier){
            if(rosterSkillMap[skill.id] !== undefined && (rosterSkillMap[skill.id] +2) >= (t+1)){
              omicron = true;
            }
          }
        }
        skillsList.push({
          id: skill.id,
          currentTier: (rosterSkillMap[skill.id] + 2) || 1,
          maxTier: (skill.tier.length + 1),
          isZeta: skill.isZeta,
          isOmicron: (skill.omicronMode > 1 ) ? true : false,
          omicronArea: skill.omicronMode,
          hasZeta: zeta,
          hasOmicron: omicron
        });
      }
      rawPlayerData.rosterUnit[u].skill = skillsList;
      //-->Get Mods
      let modSet = this.getModSetDefinitions();
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
    }

    return rawPlayerData;
  }

  /** Returns map of the designated data
   * @param {Object} data - The json file of the data to map
   * @param {String} property - The class property to add the map to
   * @return {Object} map - Returns a map of each data id with array index
   */
  getMap_(data,property){
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


  /***************************************************************************
   * Returns an object with the segment location for each collection
   */
  getSegmentDetails_(){
    const segments = {
      battleEnvironments: 1,
      battleTargetingRule: 1,
      category: 1,
      effect: 1,
      effectIconPriority: 1,
      environmentCollection: 1,
      equipment: 1,
      eventSampling: 1,
      guildBanner: 1,
      helpEntry: 1,
      material: 1,
      persistentVfx: 1,
      playerPortrait: 1,
      playerTitle: 1,
      powerUpBundle: 1,
      requirement: 1,
      skill: 1,
      socialStatus: 1,
      table: 1,
      targetingSet: 1,
      timeZoneChangeConfig: 1,
      unlockAnnouncementDefinition: 1,
      xpTable: 1,
      ability: 2,
      challenge: 2,
      challengeStyle: 2,
      cooldown: 2,
      dailyActionCap: 2,
      energyReward: 2,
      galacticBundle: 2,
      guildExchangeItem: 2,
      guildRaid: 2,
      linkedStoreItem: 2,
      modRecommendation: 2,
      mysteryBox: 2,
      mysteryStatMod: 2,
      raidConfig: 2,
      recipe: 2,
      savedSquadConfig: 2,
      scavengerConversionSet: 2,
      seasonDefinition: 2,
      seasonDivisionDefinition: 2,
      seasonRewardTable: 2,
      seasonLeagueDefinition: 2,
      starterGuild: 2,
      statMod: 2,
      statModSet: 2,
      statProgression: 2,
      territoryBattleDefinition: 2,
      territoryTournamentDefinition: 2,
      territoryTournamentDivisionDefinition: 2,
      territoryTournamentLeagueDefinition: 2,
      territoryWarDefinition: 2,
      unitGuideDefintion: 2,
      warDefinition: 2,
      relicTierDefinition: 3,
      units: 3,
      artifactDefinition: 4,
      artifactTierDefinition: 4,
      calendarCategoryDefinition: 4,
      campaign: 4,
      conquestDefinition: 4,
      conquestMission: 4,
      consumableDefinition: 4,
      consumableType: 4,
      consumableTierDefinition: 4,
      dailyLoginRewardDefinition: 4,
      datacronSet: 4,
      datacronTemplate: 4,
      datacronAffixTemplateSet: 4,
      datacronHelpEntry: 4,
      recommendedSquad: 4,
      territoryTournamentDailyRewardTable: 4,
      unitGuideLayout: 4,
    }
    return segments;
  }

  getModSetDefinitions(){
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
  /**
   * Returns object with details on stats
   */
  getStatDefinitions(){
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
}
