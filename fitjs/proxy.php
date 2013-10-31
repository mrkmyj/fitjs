<?php

switch($_POST['task'])
{
    
    case 'oauth':
        $header=oauthAuthHeader(json_decode($_POST['json']));
        break;
    case 'data':
        break;
}

echo sendRequest($_POST['url'],$header,$_POST['body'],$_POST['method']);


function oauthAuthHeader($json)
{
     $res="OAuth ";
    foreach ($json as $key=>$value)
    {
        $res=$res.$key."=\"".$value."\", ";
    }
    return array('Authorization:'.trim($res,", "));
}
function sendRequest($url, $header, $body, $method)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST,$method);    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    if($method=="PUT" || $method=="POST")
  {                 
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);    
  }  
  $res= curl_exec($ch);  
  curl_close($ch);
  return $res;
}
?>