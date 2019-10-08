const express = require('express')
const debug = require('debug')('app:server')
const path = require('path')
const webpack = require('webpack')
const webpackConfig = require('./build-utils/webpack.config')
const project = require('./build-utils/project.config')
// const QueryMap = require('./queryMapConfig')
// const ApiList = require('./apiListForServer')
// const TenantDBConfig = require('./tenantDBConfig')
const compress = require('compression')
const mysql = require('mysql');


// callback API

const app = express()
var http = require('http');
var bodyParser = require('body-parser');
// var API_LIST_ARRAY = ApiList.API_LIST_ARRAY;
// var REDSHIFT_API_LIST_ARRAY = ApiList.REDSHIFT_API_LIST_ARRAY;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// Apply gzip compression
app.use(compress());

// ------------------------------------
// Apply Webpack HMR Middleware
// ------------------------------------
  const compiler = webpack(webpackConfig)

  debug('Enabling webpack dev and HMR middleware')

  app.use(require('webpack-dev-middleware')(compiler, {
    publicPath  : webpackConfig.output.publicPath,
    contentBase : project.paths.client(),
    hot         : true,
    quiet       : project.compiler_quiet,
    noInfo      : project.compiler_quiet,
    lazy        : false,
    stats       : project.compiler_stats
  }))

  app.use(require('webpack-hot-middleware')(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000
  }));
  var replaceStr = function(str, object) { //if property not found string is not replaced
  	return String(str).replace((/\\?\{([^{}]+)\}/g), function(match, name) {
          matchedStrings = name;
          //console.log('matched name',name);
          if(object[name] != null){
              return object[name];
          }else{
              return match;
          }
  	});
  }
  var getQuery = function(reqMethod,queryInputs,api_path){
    // console.log('reqMethod :: ',reqMethod);
    // console.log('queryInputs :: ',queryInputs);
    // console.log('api_path :: ',api_path);
    var query;
      switch(reqMethod) {
        case "POST":
            query = replaceStr(QueryMap[api_path].query,queryInputs);
            if(query.toLowerCase().indexOf('es') > -1){
              console.log('query after  ',query,':::  query length :: ',query.length,'\n queryInputs :: ',queryInputs);
            }
            // console.log('query after  ',query,':::  query length :: ',query.length,'\n queryInputs :: ',queryInputs);

            if(query.indexOf('LIKE') > -1 && query.indexOf('_') > -1 && api_path.indexOf('_ON_STAG') == -1 && api_path.indexOf('_ON_PROD') == -1 ){
              var likeIdx = query.indexOf('LIKE');
              // var limitIdx = query.indexOf('LIMIT');
              var limitIdx = query.indexOf('ORDER');
              if(query.indexOf('AND') > -1 && (query.indexOf('AND') < query.indexOf('ORDER'))){
                limitIdx = query.indexOf('AND');
              }
              if(limitIdx == -1){
                limitIdx = query.length+1;
              }
              // var strToReplace = query.substring(query.indexOf('LIKE')+4, query.indexOf('LIMIT')-1);
              var strToReplace = query.substring(likeIdx+4, limitIdx-1);
              var strWithEscape = strToReplace + " ESCAPE '/' ";
              query = query.replace(strToReplace,strWithEscape);
            }
            break;
        case "PUT":
            query = QueryMap[api_path].query;
            break;
        case "DELETE":
            query = QueryMap[api_path].query;
            break;
        default:

          query = QueryMap[api_path].query;
      }
      console.log('getQuery :: ',query);
      return query;
  };
  var sendResponse=function(api_path,response,res){
    switch(api_path.toUpperCase()) {
      case "GET_COUNT_OF_DEVICES_WITH_FW_NO_FOR_MODEL":
          var neo_group = [],mqtt_group = [], stun_group = [],list = response;
          for(var i in response){
            if((response[i]['version_no'].replace('.','')) >= parseFloat("0300.00")){
              var obj = response[i];
              response[i]['group'] = 'neo_group';
              neo_group.push(response[i]);
            }
            else if((response[i]['version_no'].replace('.','')) >= parseFloat("0220.00") && (response[i]['version_no'].replace('.','')) <= parseFloat("0220.99") ){
              var obj = response[i];
              response[i]['group'] = 'mqtt_group';
              mqtt_group.push(response[i]);
            }
            else{
              var obj = response[i];
              response[i]['group'] = 'stun_group';
              stun_group.push(response[i]);
            }
          }
          var chartInfo = [
            {
            'name' : 'Neo / Orbweb',
            'value' : neo_group.length
          },
            {
            'name' : 'MQTT',
            'value' : mqtt_group.length
          },
            {
            'name' : 'STUN',
            'value' : stun_group.length
          }
        ];
          var responseObj = {
            neo_group : neo_group,
            mqtt_group : mqtt_group,
            stun_group : stun_group,
            chartInfo : chartInfo,
            list : list
          }
          // console.log('neo_group :: ',neo_group,'\n ','mqtt_group :: ',mqtt_group,'\n ','stun_group :: ',stun_group);
          res.send(responseObj);
          res.end();
          break;
      case "GET_COUNT_OF_ACTIVE_DEVICES_BY_LOCATION" :
      case "GET_COUNT_OF_ACTIVE_DEVICES_FOR_MODEL_BY_LOCATION" :
      var responseArr = [],countryArr = [],
        sortedResponse = response.sort(function(a, b){
              var nameA=a.metric, nameB=b.metric;
              if (nameA < nameB) //sort string ascending
                  return -1
              if (nameA > nameB)
                  return 1
              return 0 //default return value (no sorting)
          });
          for(var i in sortedResponse){
              countryArr.push({
                name : sortedResponse[i].metric,
                value : sortedResponse[i].metric
              });
          }
          response.sort(function(a, b){
              return b.value-a.value
          });

          responseObj={
            list : response,
            countryList : countryArr
          };
        // res.send(responseArr);
        res.send(responseObj);
        res.end();
        break;
      case "GET_LIST_OF_DEVICE_COUNTS_BY_MODEL_NO" :
      case "GET_LIST_OF_DEVICE_COUNTS_BY_FW" :
          for(var i in response){
            response[i].fill = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
          }
      res.send(response);
      res.end();
      break;
      case "ES_SEARCH" :
        var searchResultObj = {};
        searchResultObj={
          list : [],
          total:0
        }
        console.log(' ES_SEARCH response.data.hits.total :: ',response.hits.total, typeof response.hits.total);
        if(response.hits.total > 0){
          searchResultObj.total = response.hits.total;
          for(var i in response.hits.hits){
            searchResultObj.list.push(response.hits.hits[i]._source);

          }
        }
      res.send(searchResultObj);
      // res.send(response);
      res.end();
      break;
      // case "GET_LIST_OF_DEVICE_COUNTS_BY_MODEL_NO_AND_FW" :
      //   var responseArr = [],tempModelArr = [];
        // for(var i in response){
          // DO NOT DELETE IT
          // if(tempModelArr.indexOf(response[i].model_no) == -1){
          //   tempModelArr.push(response[i].model_no);
          //   var obj = {
          //     name : response[i].model_no,
          //     fill : '#'+(Math.random()*0xFFFFFF<<0).toString(16),
          //     count : response[i].count
          //   };
          //   // obj.children.push(response[i]);
          //   responseArr.push(obj);
          // }
          // else{
          //   for(var j in responseArr){
          //     if(responseArr[j].name == response[i].model_no){
          //       responseArr[j].count = responseArr[j].count + response[i].count;
          //       // responseArr[j].push(response[i]);
          //     }
          //   }
          // }
          /*
          response[i].mode = response[i].name;
          response[i].name = response[i].model_no;
          if(tempModelArr.indexOf(response[i].model_no) == -1){
            tempModelArr.push(response[i].model_no);
            var obj = {
              name : response[i].model_no,
              children : []
            };
            obj.children.push(response[i]);
            responseArr.push(obj);
          }
          else{
            for(var j in responseArr){
              if(responseArr[j].name == response[i].model_no){
                responseArr[j].children.push(response[i]);
              }
            }
          }
          */

          // if(responseObj[response[i].model_no] == undefined || responseObj[response[i].model_no] == null){
          //   responseObj[response[i].model_no] = [];
          // }
          // responseObj[response[i].model_no].push(response[i]);
        // }
      // res.send(responseArr);
      // res.end();
      //   break;
      default:

        res.send(response);
        res.end();
    }
  }
  // var redshiftClient;
  // var pgPool = new Pool();
  app.use(express.static(project.paths.public()))
  app.use('*', function (req, res, next) {
    const filename = path.join(compiler.outputPath, 'index.html')
    compiler.outputFileSystem.readFile(filename, (err, result) => {
      if (err) {
        return next(err)
      }
      var parsedOriginalUrlObjStr;
        // console.log('req :: ',req.method, req.body);
      if(req._parsedOriginalUrl == undefined){
        parsedOriginalUrlObjStr = JSON.stringify(req._parsedUrl);
      }
      else{
        parsedOriginalUrlObjStr = JSON.stringify(req._parsedOriginalUrl);
      }
      parsedOriginalUrlObjStr = parsedOriginalUrlObjStr.replace('Url {','{');
      var parsedOriginalUrlObj = JSON.parse(parsedOriginalUrlObjStr);
      var api_path = parsedOriginalUrlObj.pathname.replace('/','');

      var API_LIST_ARRAY = [];

      // console.log('connection :: ',connection);
      // console.log('api_path :: ',api_path.toUpperCase(),'\n API_LIST_ARRAY.indexOf(api_path.toUpperCase()) :: ',API_LIST_ARRAY.indexOf(api_path.toUpperCase()));

      if(API_LIST_ARRAY.indexOf(api_path.toUpperCase()) > -1){
        // console.log('SQL req.body :: ',req.body,'\nSQL req.tenant :: ',req.body.tenant,'\nSQL TenantDBConfig[req.body.tenant] :: ',TenantDBConfig[req.body.tenant]);
        var query = getQuery(req.method, req.body,api_path.toUpperCase());
        // TenantDBConfig
        // console.log('SQL DB query :: ',query);
        const connection = mysql.createConnection(TenantDBConfig[req.body.tenant].sqlConfig);

        connection.connect((err) => {
          if (err) {
            console.log('SQL Error!',err);
          }
          else {
            console.log('SQL Connected!');
          }
        });
        connection.query(query,
            function (err, response) {
                if (err) console.log('SQL error occured :: ',err);
                res.set('content-type', 'application/json')
                sendResponse(api_path,response,res);
                // res.send(response);
                // res.end()
                connection.end();
            }
        );
      }

      else{
        res.set('content-type', 'text/html')
        res.send(result);
        res.end()
      }
    })
  });
  debug('initializing connection ');
module.exports = app;


const server = http.createServer(app);
server.listen(3003);
server.on('listening', () => {
  console.log('Server is listening on port: 3003');
});
