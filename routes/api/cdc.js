const express = require("express");
const router = express.Router();
const cdc = require("../../cdc");
// const got = require('got');
const fetch = require("node-fetch");
const res = require("express/lib/response");
const { post } = require("./items");
// const https = require("https");
// const { create } = require("domain");
// const { param } = require("express/lib/request");
// const FormData = require("form-data");
// const { json } = require("express/lib/response");

// Options
router.options("/", (req, res) => {
  console.log(req);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});
// Get requests
router.get("/", (req, res) => {
  res.json({ msg: "getting cdc" });
});

// Post requests
router.post("/", (req, res) => {
  // for registering lite accounts isLite is set to true in POST Body
  const isLite = req.body.isLite;

  // JSON to be sent back to the front-end to display all requests and responses
  const responseBody = {
    'regToken' : {
      'regTokenRequest' : '',
      'regTokenResponse' : ''
    },
    'setAccountInfo' : {
      'setAccountInfoRequest' : '',
      'setAccountInfoResponse' : ''
    },
    'dsStore' : {
      'dsStoreRequest' : '',
      'dsStoreResponse' : '',
    }
  }

  // API call chain starts here. First need Registration token. 
  const regToken = getRegToken(
    cdc.cred,
    isLite,
    cdc.dataCenters.us1,
    cdc.apiCalls.initReg,
    req.body,
    res,
    responseBody
  );
});

function getRegToken(cred, lite, dc, apiCall, data, res, responseBody) {
  console.log(data);
  let url = createUrl("accounts", dc, apiCall);
  let params = cred.apiKey;
  let met = "GET";
  regTokenRequest(params, url, met, lite, data, res, responseBody);
}

async function regTokenRequest(params, url, met, lite, data, res, responseBody) {
  // use dyamically generated URL to make POST request to CDC. 
  // specific api call: initRegistration

  const fullUrl = url + "?apikey=" + params + "&isLite=" + lite;
  responseBody.regToken.regTokenRequest = fullUrl;
  try {
    const response = await fetch(fullUrl);
    const json = await response.json();
    // res.setHeader('Content-Type', 'application/json');
    // console.log(json);
    responseBody.regToken.regTokenResponse = json;
    // After promise is resolved, set up set account info 
    setAccountInfo(
      cdc.cred,
      cdc.dataCenters.us1,
      cdc.apiCalls.setAccount,
      json.regToken,
      data,
      res,
      responseBody
    );
    // return json.regToken;
  } catch (error) {
    console.log(error);
  }
}

function setAccountInfo(cred, dc, apiCall, token, body, res, responseBody) {
  let url = createUrl("accounts", dc, apiCall);

  const params = {
    apiKey: cred.apiKey,
    userKey: cred.userKey,
    secret: cred.secret,
  };

  // different call for repair or whitening

  if (body.CampaignID === "Whitening") {
    // console.log(body);
    // let subBool = body.subscriptions_whitening;
    // let privBool = body.privacy;
    const postBody = {
      regToken: token,
      profile: {
        email: body.email,
        firstName: body.first_name,
      },
      CampaignID: body.CampaignID,
      subscriptions: {
        SensodyneID: {
          email: {
            isSubscribed : body.subscriptions_brandID,
          }
        },
        brandwide: {
          email: {
            isSubscribed : body.subscriptions_gsk,
          }
        },
      },
      data : {
        US_GSK_PrivacyPolicy: {
          isConsentGranted : body.privacy,
        },
        US_AgeConsent: {
          isConsentGranted : body.age_consent,
        }
      },
      context: [
        "BrandId:" + body.BrandID,
        "CampaignID:" + body.CampaignID,
        "profile.firstName:" + body.first_name,
        "profile.email:" + body.email,
        "subscription.sensodyneID.email.isSubscribed:" + body.subscriptions_brandID,
        "subscription.brandwide.email.isSubscribed:" + body.subscriptions_gsk,
        "Question:How many times do you brush your teeth per day?",
        "Answer:" + body.question_whitening,
      ],
    };
    setAccountInfoRequest(url, params, postBody, res, responseBody);
  } else if (body.CampaignID === "Repair") {
    const postBody = {
      regToken: token,
      profile: {
        email: body.email,
        firstName: body.first_name,
        lastName: body.last_name,
      },
      CampaignID: body.CampaignID,
      subscriptions: {
        SensodyneID: {
          email: {
            isSubscribed : body.subscriptions_brandID,
          }
        },
        brandwide: {
          email: {
            isSubscribed : body.subscriptions_gsk,
          }
        },
      },
      data : {
        US_GSK_PrivacyPolicy: {
          isConsentGranted : body.privacy,
        },
        US_AgeConsent: {
          isConsentGranted: body.age_consent,
        }
      },
      context: [
        "BrandId:" + body.BrandID,
        "CampaignID:" + body.CampaignID,
        "profile.firstName:" + body.first_name,
        "profile.lastName:" + body.last_name,
        "profile.email:" + body.email,
        "subscription.sensodyneID.email.isSubscribed:" + body.subscriptions_brandID,
        "subscription.brandwide.email.isSubscribed:" + body.subscriptions_gsk,
        "preferences.privacy.USPrivacyPolicy.isConsentGranted:"+ body.privacy,
        "Question:How many times do you go to the dentist per year?",
        "Answer:" + body.question_repair,
        "Question: What is your favorite flavor?",
        "Answer:" + body.question_flavor,
      ],
    };
    setAccountInfoRequest(url, params, postBody, res, responseBody);
  }
}

async function setAccountInfoRequest(url, params, postBody, res, responseBody) {
  // res.write('setAccountInfoRequest:');
  // res.end();

  // generate post body for post request to cdc
  let timeDateStamp = new Date().toISOString();
  let apiKey = "apiKey='" + params.apiKey + "'";
  let userKey = "userKey='" + params.userKey + "'";
  let secret = "secret='" + params.secret + "'";
  let credentials = apiKey + userKey + secret;
  let regToken = "&regToken=" + postBody.regToken;
  let profile;
  if(postBody.profile.lastName) {
    profile =
      "&profile={'email':'" +
      postBody.profile.email +
      "', 'firstName':'" +
      postBody.profile.firstName +
      "', 'lastName':'" +
      postBody.profile.lastName +
      "'}";
  } else {
    profile =
      "&profile={'email':'" +
      postBody.profile.email +
      "', 'firstName':'" +
      postBody.profile.firstName +
      "'}";
  }
  // let data = "&data={'US_GSK_PrivacyPolicy' : { 'isConsentGranted' : '" + postBody.data.US_GSK_PrivacyPolicy.isConsentGranted + "'}}";
  let subscriptions = "&subscriptions={'sensodyneID' : { 'email' : { 'isSubscribed' : '"+ postBody.subscriptions.SensodyneID.email.isSubscribed +"',}}, 'brandwide' : {'email' : { 'isSubscribed' : '" + postBody.subscriptions.brandwide.email.isSubscribed + "'}}}";
  let data = "&data={'US_GSK_PrivacyPolicy' : {'isConsentGranted':'" + postBody.data.US_GSK_PrivacyPolicy.isConsentGranted + "', 'lastUpdated': '" + timeDateStamp + "'}, 'US_AgeConsent' : {'isConsentGranted' : '"+ postBody.data.US_AgeConsent.isConsentGranted +"', 'lastUpdated': '" + timeDateStamp + "'}}";
  let context = "&context='" + postBody.context + "'";
  let bodyData = credentials + regToken + profile + subscriptions + data + context;
  responseBody.setAccountInfo.setAccountInfoRequest = bodyData;
  try {
    const response = await fetch(url, {
      method: "post",
      body: bodyData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const json = await response.json();
    responseBody.setAccountInfo.setAccountInfoResponse = json;
    // console.log('setAccountInfo response: ')
    console.log(json);
    dsStore(params, postBody, json.UID, res, responseBody);
    // return json.regToken;
  } catch (error) {
    console.log(error.response.body);
  }
}

// last call to CDC, datastore
async function dsStore(params, data, UID, res, responseBody) {
  let url = createUrl("ds", cdc.dataCenters.us1, cdc.apiCalls.dsStore);
  let uriEncodedSecret = encodeURIComponent(params.secret);
  let dsStoreBody =
    "apiKey=" +
    params.apiKey +
    "&userKey=" +
    params.userKey +
    "" +
    "&secret=" +
    uriEncodedSecret +
    "&type=Sensodyne" +
    `&data={"UID" : "${UID}"}, "CampaignID":"${data.CampaignID}", "FormSubmission":"${data.context}"` +
    "&oid=auto";
  // console.log(dsStoreBody);
  responseBody.dsStore.dsStoreRequest = dsStoreBody;
  try {
    const response = await fetch(url, {
      method: "post",
      body: dsStoreBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const json = await response.json();
    responseBody.dsStore.dsStoreResponse = json;
    res.json(responseBody);
    // console.log("new object OID: " + json.oid);
    // return json.regToken;
  } catch (error) {
    console.log(error.response.body);
  }
}

function createUrl(namespace, datacenter, endpoint) {
  let url = "https://" + namespace + "." + datacenter + "/" + endpoint;
  return url;
}

module.exports = router;
