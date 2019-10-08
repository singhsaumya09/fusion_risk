import apiEndpoints from '../config/api_endpoints';
import AppConfig from '../config/AppConfig';
import axios from 'axios';
import { loadProgressBar } from 'axios-progress-bar';
import '../styles/nprogress.scss';
// import 'axios-progress-bar/dist/nprogress.css';
import {browserHistory} from 'react-router';
import ErrorHandler from './error_handler';
import $ from 'jquery';

loadProgressBar();
let matchedStrings;
let HttpAPI = function(name, params) {
  // var BASE_URL = AppConfig.commonConf.API_CONFIG[window.location.host].BASE_URL;
  var tenantName = JSON.parse(localStorage.getItem('TenantInfo'));
  // var BASE_URL = AppConfig.ServerAPIurls[tenantName];

  if(tenantName == null || tenantName == undefined){
    browserHistory.push('/Login');
    return false;
  }
  else if(typeof tenantName == 'object' && tenantName != null){
    console.log('tenant info is not updated :: ',typeof tenantName, tenantName);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
    // browserHistory.push('/Login');
    // return false;
  }
  var BASE_URL = AppConfig.TENANT_CONFIG[tenantName].URL_CONF.SERVER_API_URL;
  $('#overlay').show();
  // console.log('name, params ::: ',BASE_URL,name, params,apiEndpoints[name]);

  matchedStrings = '';
	let callMethod = apiEndpoints[name].method;
	var callPath = params['version'] + '/' + apiEndpoints[name].path;
  if(name.indexOf('SERVICE_HEALTH_REPORT') > -1){
    BASE_URL = 'https://healthcheck.hubble.in/';
    callPath = apiEndpoints[name].path;
  }
  if(name.indexOf('_FROM_ES') > -1){
    // BASE_URL = 'https://search-h2o-qegdqkzczsi2w7ykwkyxexckw4.us-east-1.es.amazonaws.com/';
    // BASE_URL = 'https://controlcenter.hubble.in:9090/';  ENABLE IT FOR PROD-ENV
    BASE_URL = 'https://search-h2o-qegdqkzczsi2w7ykwkyxexckw4.us-east-1.es.amazonaws.com/';
    callPath = apiEndpoints[name].path;
  }
  // REMOVE FOLLOWING IF BLOCK BEFORE CODE COMMIT
  // else if(name.indexOf('GET_DEVICE_EVENTS_TIMELINE') > -1 || name.indexOf('GET_DEVICE_EVENTS_SUMMARY') > -1){
  //     BASE_URL = 'https://api.hubble.in/';
  //   }
  else{
    // BASE_URL = AppConfig.commonConf.API_CONFIG[window.location.host].BASE_URL;
    // BASE_URL = AppConfig.ServerAPIurls[tenantName];
    BASE_URL = AppConfig.TENANT_CONFIG[tenantName].URL_CONF.SERVER_API_URL;
  }
  // if(name.indexOf('GDPR') > -1){
  //   BASE_URL = 'https://dev-api-h2o.hubble.in/';
  //   callPath = params['version'] + '/' + apiEndpoints[name].path;
  // }
  // delete params['version'];
	let new_url = replace(callPath, params);
  delete params[matchedStrings];
  let reqObj = {
    method: callMethod,
    url:  BASE_URL + new_url + '.json',
    headers: {'Content-Type': 'application/json'},
    data : {},
    params : {}
  }

  if(callMethod == 'post' ||callMethod == 'delete'){
    reqObj.data = params.data;
    delete params['data'];
    if(reqObj.data == undefined){
      reqObj.data = {};
    }
    // reqObj.data['tenant'] = 'HUBBLE-STAG';
    if(name.indexOf('_FROM_DB') > -1 || name.indexOf('_FROM_ES') > -1){
      reqObj.data['tenant'] = tenantName;
    }
  }

  if(name.indexOf('_FROM_DB') > -1){
    reqObj.url = '/'+ apiEndpoints[name].path;
  }
  else if(name.indexOf('_FROM_ES') > -1 ){
    reqObj.url = BASE_URL+ apiEndpoints[name].path;
  }
  else if(name != 'GET_AUTH_TOKEN'){
    if(Object.keys(params).length > 0){
     reqObj.params =  params.params;
   }
    // var userContext = JSON.parse(localStorage.getItem('userContext'));
    // reqObj.params={api_key : userContext.authentication_token };

  }


  // reqObj.params['tenant'] = 'HUBBLE_STAG';
  // console.log('reqObj :: ',reqObj);
      return new Promise(function(resolve, reject){
        axios(reqObj).then(function(response){
          $('#overlay').hide();
            resolve(response)
        }).catch(function(error){
          // console.log(typeof error  ,JSON.stringify(error));
          var errHandler = {};
          if(error.response != undefined && error.response.headers.hasOwnProperty('X-response-code')){
            errHandler = ErrorHandler.returnErrorObj(error.response.headers.hasOwnProperty('X-response-code'));
          }
          var errMsgObj = {
            '4' : 'INFO',
            '5' : 'REDIRECT'
          };
          if(errHandler.message == undefined){
            errHandler.message = error.message;

          }
          // console.log(((error.response.status).toString()).charAt(0));
          if(error.response){
            var errHandlerObj = {
              'status' : error.response.status,
              'errMsg' : errHandler.message,
              'errType' :  errMsgObj[((error.response.status).toString()).charAt(0)]
              // 'errType' :  errMsgObj['5']
            }
            error.errHandlerObj = errHandlerObj;
          }
          $('#overlay').hide();
          reject(error);
        /*  if(error.hasOwnProperty('response') && error.response.hasOwnProperty('status') && error.response.status == 401 && isLoggedIn()){
              logout()
          }else{
            reject(error)
          } */
        })
      });
}

let replace = function(str, object) { //if property not found string is not replaced
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

let logout = function(){
  localStorage.clear();
  sessionStorage.clear();
  // localStorage.removeItem('userContext');
  browserHistory.push('/Login');
}

let isLoggedIn = function() {
	if (sessionStorage.getItem("auth_data") == null) {
		console.log('not logged in')
		return false;
	} else {
        return true;
    }
}

export default HttpAPI;
