# Introduction #

FitJS is a AJAX (containing javascript and php) library for Fitbit's RESTful API. It's initial release focuses on Fitbit's OAuth authentication process. So users can call javascript functions directly to automate the authentication process.

1.0 version only supports OAuth

# A Quick Guide to Using FitJS OAuth #

<img src='https://fitjs.googlecode.com/svn/download/oauth.png'>

<h2>Prerequisite</h2>
<ul><li>You need to know basics of Javascript and/or PHP<br>
</li><li>You ought to understand basics of OAuth authentication. If not, you may want to read <a href='https://wiki.fitbit.com/display/API/OAuth+Authentication+in+the+Fitbit+API#OAuthAuthenticationintheFitbitAPI-TheOAuthFlow'>https://wiki.fitbit.com/display/API/OAuth+Authentication+in+the+Fitbit+API#OAuthAuthenticationintheFitbitAPI-TheOAuthFlow</a></li></ul>

<b>1. Using FitJS</b>

<ul><li>copy the entire FitJS folder to your javascript folder<br>
</li><li>include fitjs.js in your html<br>
<pre><code>&lt;script src="fitjs/fitjs.js"&gt;&lt;/script&gt;   <br>
</code></pre></li></ul>

<b>2. Initializing FitJS</b>

<pre><code>foauth=new FitJS_OAuth("http://example.com/oauthverifier.php",  //callback URL for OAuth verifier<br>
                                "999999999999999999999999", //consumer key provided by Fitbit<br>
                                "HMAC-SHA1" // hash method. FitJS 1.0 only supports HMAC-SHA1.<br>
                                );<br>
</code></pre>

<b>3. Request Token</b>

<pre><code>    var baseString=foauth.oauthBaseString("request_token"); // create base string of the signature<br>
    var signature=foauth.oauthSignatureString(baseString); // generate signature string with HMAC-SHA1<br>
    foauth.requestToken(signature, true, readyStateChange);   // request token  <br>
    // second parameter means whether it is an asynchronous call<br>
    // third parameter is a call back function for handling state changes on the XMLHttpRequest<br>
</code></pre>

Please note that "readyStategChange" is a callback function that will take XMLHttpRequest as an argument. To check whether you receive a valid response you may want to do:<br>
<br>
<pre><code>   function readyStateChange(xmlhttp)<br>
{<br>
    if (xmlhttp.readyState===4 &amp;&amp; xmlhttp.status===200)<br>
    {<br>
        //receive temporary token from Fitbit API successfully<br>
    }<br>
    else<br>
    {<br>
        // error handling<br>
    }<br>
}<br>
</code></pre>

<b>4. Redirect users to Fitbit.com for Authorization"</b>

After you received a valid token from Fitbit.com you should then redirect your users to Fitbit.com for their authorizations on your access to their data. In the example below, the redirection is sent out only when token is received. Therefore, the code is placed in "readyStateChange" function (in the last step)<br>
<br>
<br>
<pre><code>function readyStategChange(xmlhttp)<br>
{<br>
    if (xmlhttp.readyState===4 &amp;&amp; xmlhttp.status===200)<br>
    {<br>
        foauth.authorize(true, "en_US", false, 800, 500);<br>
       // first parameter means whether you want the redirection to be done in the main window or a popup. If you choose to use Popup, you may want to ensure the browser has not blocked pop-up first<br>
      // second parameter is the locale of the window. For a list of locales Fitbit support, you can check out https://wiki.fitbit.com/display/API/API+Localization<br>
      // third parameter means whether the page is for a mobile device<br>
      // fourth and fifth parameters are the width and height of the pop-up respectively if you choose to redirect the user via a pop-up<br>
        foauth.checkOAuthVerifier(2000, 10000, onTimeOut, onFinished, onFailed);<br>
       // First parameter means how frequently (in milliseconds) should the webpage talk to the server to figure out whether users has authorized the access. Please implement the code in "oauthverifier.php" located in the "FitJS" folder to look up your database and return with format specified in the php file<br>
       // Second parameter means timeout in milliseconds (if the server does not respond within this threshold, the connection will be shut down. <br>
       // the last three parameters are the functions that handles different events<br>
    }<br>
}<br>
</code></pre>

In the example above, you can see the constant checking is initiated once the pop-up is generated. The checking will be stopped once it detects "oauthverifier" has already returned verifier after user authorize the access.<br>
<br>
onTimeOut, onFinished and onFailed are all callback functions accepting one standard XMLHttpRequest argument. In step 5, you can see how onFinished is implemented<br>
<br>
<b>5. Accessing Token</b>

<pre><code>function onFinished()<br>
{<br>
    var basestring=foauth.oauthBaseString("access_token");<br>
    // generate the base string for access token request <br>
    var signature=foauth.oauthSignatureString(basestring);  <br>
    // generate signatur string for the access token request <br>
    foauth.accessToken(signature, true, onAccessTokenStateChange);<br>
    // second parameter means whether it is an asynchronous call<br>
    // third parameter is a call back function for handling state changes on the XMLHttpRequest<br>
}<br>
<br>
<br>
function onAccessTokenStateChange(xmlhttp)<br>
{<br>
        if (xmlhttp.readyState===4 &amp;&amp; xmlhttp.status===200)<br>
    {<br>
        alert("token:"+foauth.oauth_token+" token secret:"+foauth.oauth_token_secret+" user id: "+foauth.oauth_token_secret);    <br>
    }<br>
}<br>
</code></pre>