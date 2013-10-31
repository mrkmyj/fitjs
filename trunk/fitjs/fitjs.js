
function FitJS_OAuth(callbackUrl, consumerKey, hashMethod)
{
    this.url={
        request_token:"http://api.fitbit.com/oauth/request_token",
        access_token:"http://api.fitbit.com/oauth/access_token",        
        authorize:"https://www.fitbit.com/oauth/authenticate",
        verifier:"fitjs/oauthverifier.php",
        signature:'fitjs/oauthsignature.php',
        proxy:"fitjs/proxy.php"        
    };
    this.callbackUrl=encodeURIComponent(callbackUrl);
    this.consumerKey=consumerKey;
    this.hashMethod=hashMethod;
    this.verifier="";
    this.token="";
    this.tokenSecret="";
    this.callbackConfirmed="";
    this.checkVerifier=null;
    this.request_token_timestamp="";
    this.request_token_nonce="";
    this.access_token_timestamp="";
    this.access_token_nonce="";
    
}

function  getXHR()
{
    var  xhr=false;
    try 
    {
         xhr=new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch(e) 
    {
        try  
        {
            xhr=new ActiveXObject("Microsoft.XMLHTTP");
        } 
        catch(E) 
        {
             xhr=false ;
        }
    }
    if(!xhr&&typeof XMLHttpRequest!=='undefined') 
    {
        xhr=new XMLHttpRequest();
    }
    return xhr;
}
FitJS_OAuth.prototype.oauthSignatureString= function (baseString)
{
    var xmlhttp=getXHR();        
    xmlhttp.open("GET",this.url.signature+"?string="+baseString,false);  
    xmlhttp.send();
    if(xmlhttp.status===200)
    {
        return xmlhttp.responseText;
    }
    else
    {
        return "";
    }
       

};


FitJS_OAuth.prototype.oauthBaseString= function (stage)
{
    switch(stage)
    {
        case 'request_token':
            this.request_token_timestamp=timeStamp();
            this.request_token_nonce=randomString();
            this.request_token_base= encodeURIComponent('POST'+'&'+this.url.request_token+'&oauth_callback='+this.callbackUrl+'&oauth_consumer_key='+this.consumerKey
            +'&oauth_nonce='+this.request_token_nonce+'&oauth_signature_method='+this.hashMethod+
            '&oauth_timestamp='+this.request_token_timestamp+'&oauth_version=1.0');
            return this.request_token_base;
            break;
        case 'access_token':
            this.access_token_timestamp=timeStamp();
            this.access_token_nonce=randomString();
            this.access_token_base= encodeURIComponent('POST'+'&'+this.url.access_token+'&oauth_consumer_key='+this.consumerKey
            +'&oauth_nonce='+this.access_token_nonce+'&oauth_signature_method='+this.hashMethod+
            '&oauth_timestamp='+this.request_token_timestamp+'&oauth_version=1.0'+'&oauth_token='+this.token+'&oauth_verifier='+this.verifier);
            return this.access_token_base;
            break;                
    }
};

FitJS_OAuth.prototype.requestToken=function (signature, async, onreadyStateChange)
{    
    var hjson={
      "oauth_callback":this.callbackUrl,
      "oauth_consumer_key":this.consumerKey,
      "oauth_nonce":this.request_token_nonce,
      "oauth_signature":String(signature),
      "oauth_signature_method":this.hashMethod,       
      "oauth_timestamp":this.request_token_timestamp, 
      "oauth_version":"1.0"      
    };         
    var foauth=this;
    var xmlhttp=getXHR();    
    if(async)
    {
            xmlhttp.onreadystatechange=function()
            {           
                    if (xmlhttp.readyState===4 && xmlhttp.status===200)
                    {
                        var args=deserilizeQuery(xmlhttp.responseText);
                        foauth.token=args['oauth_token'];
                        foauth.tokenSecret=args['oauth_token_secret'];
                        foauth.callbackConfirmed=args['oauth_callback_confirmed'];
                    }
                onreadyStateChange(xmlhttp);     
            };   
    }

    xmlhttp.open("POST",this.url.proxy,async);  
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded"); 
    xmlhttp.send("task=oauth&url="+this.url.request_token+"&method=POST&json="+JSON.stringify(hjson));
    if(!async)
    {
        if(xmlhttp.status===200)
        {
            var args=deserilizeQuery(xmlhttp.responseText);
            foauth.token=args['oauth_token'];
            foauth.tokenSecret=args['oauth_token_secret'];
            foauth.callbackConfirmed=args['oauth_callback_confirmed'];     
        }
        return xmlhttp;
    }
};

FitJS_OAuth.prototype.stopCheckingOAuthVerifier=function()
{
    if(this.checkVerifier!==null)
    {
        clearTimeout(this.checkVerifier);
    }
};

FitJS_OAuth.prototype.checkOAuthVerifier=function(interval, timeout, onTimedOut, onFinished, onFailed)
{
    var foauth=this;
    var xmlhttp=getXHR();      
    xmlhttp.timeout = timeout;
    xmlhttp.ontimeout = onTimedOut;
    xmlhttp.onreadystatechange=function()
            {           
                    if (xmlhttp.readyState===4)
                                
                    {
                        if(xmlhttp.status===200)
                        {
                            var args=deserilizeQuery(xmlhttp.responseText);
                            if(Object.keys(args).length>0)
                            {
                                 if(("verifier" in args) && ("token" in args))
                                 {
                                    foauth.stopCheckingOAuthVerifier();
                                    foauth.verifier=args['verifier'];                                    
                                    foauth.checkVerifier=null;
                                    onFinished(xmlhttp);
                                 }
                                 else
                                {
                                    foauth.checkVerifier=setTimeout(
                                    function(){                                
                                                foauth.checkOAuthVerifier(interval, timeout, onTimedOut, onFinished, onFailed);
                                              },interval);
                                }
                            }
                            else
                            {
                                foauth.checkVerifier=setTimeout(
                                function(){
                                            foauth.checkOAuthVerifier(interval, timeout, onTimedOut, onFinished, onFailed);
                                          },interval);
                            }                       
                        }
                        else
                        {
                            onFailed(xmlhttp);
                        }
                        
                    }
                    
            };   
    xmlhttp.open("GET",this.url.verifier+"?token="+this.token,true);      
    xmlhttp.send();     
    
};


FitJS_OAuth.prototype.accessToken=function(signature, async, onreadyStateChange)
{
    var hjson={
      "oauth_consumer_key":this.consumerKey,         
      "oauth_nonce":this.access_token_nonce,
      "oauth_signature":String(signature),
      "oauth_signature_method":this.hashMethod,       
      "oauth_timestamp":this.access_token_timestamp, 
      "oauth_token":this.token,     
      "oauth_verifier":this.verifier,
      "oauth_version":"1.0"      
    };         
    var foauth=this;
    var xmlhttp=getXHR();    
    if(async)
    {
            xmlhttp.onreadystatechange=function()
            {           
                    if (xmlhttp.readyState===4 && xmlhttp.status===200)
                    {
                        var args=deserilizeQuery(xmlhttp.responseText);
                        foauth.token=args['oauth_token'];
                        foauth.tokenSecret=args['oauth_token_secret'];
                        foauth.encoded_user_id=args['encoded_user_id'];

                    }
                        onreadyStateChange(xmlhttp);     
            };   
    }

    xmlhttp.open("POST",this.url.proxy,async);  
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded"); 
    xmlhttp.send("task=oauth&url="+this.url.access_token+"&method=POST&json="+JSON.stringify(hjson));
    if(!async)
    {
        if(xmlhttp.status===200)
        {
            var args=deserilizeQuery(xmlhttp.responseText);
                foauth.token=args['oauth_token'];
                foauth.tokenSecret=args['oauth_token_secret'];
                foauth.encoded_user_id=args['encoded_user_id'];   
        }
        return xmlhttp;
    }
};

FitJS_OAuth.prototype.authorize=function(usePopUp, locale, mobile, popupWidth, popupHeight)
{
    var url=this.url.authorize+'?oauth_token='+this.token;
    if(locale!=="")
    {
        url=url+'&locale='+locale;
    }
    if(mobile)
    {
        url=url+'&display=touch';
    }
    if(usePopUp)
    {
        window.open(url,'_blank','width='+popupWidth+',height='+popupHeight+',toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1');
        return false;
    }
    else
        window.location.href = url;
};

function timeStamp()
{
    var d=new Date();
    return d.getTime();
}

function deserilizeQuery(string)
{
    var query = {};
    var a = string.split('&');
    for (var i in a)
    {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
  return query;
}

function randomString()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

