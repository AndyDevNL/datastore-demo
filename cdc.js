/* All credentials and variables to construct URL and API calls */

const apiKey = 'secret';
const userKey = 'secret' ;
const secret = 'secret';

const url = "https://accounts.eu1.gigya.com/";

const apiCalls = {
   "initReg" : "accounts.initRegistration", 
   "setAccount" : "accounts.setAccountInfo",
   "dsStore" : "ds.store",
}

const dataCenters = {
    "us1" : "us1.gigya.com",
    "eu1" : "eu1.gigya.com",
    "au1" : "au1.gigya.com",
    "eu2" : "eu2,gigya.com",
    "ru1" : "ru1.gigya.com",
    "cn1" : "cn1.sapcdm.cn",
    "global" : "global.gigya.com"
}


const cred = {
    'apiKey' : apiKey,
    'userKey': userKey,
    'secret' : secret
};

const cdc = {
    'dataCenters' : dataCenters,
    'apiCalls': apiCalls,
    'cred' : cred
}

module.exports = cdc;
