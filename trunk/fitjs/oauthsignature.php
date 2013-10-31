<?php
//You should add code to prevent requests from other domains

$consumer_secret="REPLACE THIS STRING WITH YOUR OWN SECRET";
echo(hash_hmac("sha1", $_GET["string"], $consumer_secret)); 
?>
