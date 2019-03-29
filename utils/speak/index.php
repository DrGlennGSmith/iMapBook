<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>espeak test page</title>
        <link rel="stylesheet" href="http://code.jquery.com/mobile/1.0a2/jquery.mobile-1.0a2.min.css" />
        <script src="http://code.jquery.com/jquery-1.4.4.min.js"></script>
        <script src="http://code.jquery.com/mobile/1.0a2/jquery.mobile-1.0a2.min.js"></script>
        
        <script type="text/javascript">
        var channel_max = 10;                                   // number of channels
        audiochannels = new Array();
        for (a=0;a<channel_max;a++) {                           // prepare the channels
                audiochannels[a] = new Array();
                audiochannels[a]['channel'] = new Audio();      // create a new audio object
                audiochannels[a]['finished'] = -1;              // expected end time for this channel
        }

        function play_multi_sound(s) {
                for (a=0;a<audiochannels.length;a++) {
                        thistime = new Date();
                        document.getElementById("output").innerHTML=thistime.getTime() + " codec: " + document.getElementById("imb_codec").value;
                        if (audiochannels[a]['finished'] < thistime.getTime()) { // is this channel finished?
                                audiochannels[a]['finished'] = thistime.getTime() + 10000; // if so, set expected play duration to 10s
                                audiochannels[a]['channel'].src = document.getElementById(s).src;
                                //audiochannels[a]['channel'].type = document.getElementById(s).type;
                                audiochannels[a]['channel'].load();
                                audiochannels[a]['channel'].play();
                                break;
                        }
                }
        }
                
        function play_sound() {
        	var xmlhttp;
        	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        	  xmlhttp=new XMLHttpRequest();
        	}
        	else {// code for IE6, IE5
        	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        	}
        	xmlhttp.open("GET","service.php?imb_text=" + document.getElementById("imb_text").value + "&imb_attr=" + encodeURIComponent(document.getElementById("imb_attr").value) + "&imb_codec=" + document.getElementById("imb_codec").value, true);
        	xmlhttp.send();
        	
        	xmlhttp.onreadystatechange=function() {
	        	if (xmlhttp.readyState==4 && xmlhttp.status==200) {
	        		//document.getElementById("imbs").setAttribute('src', 'bob.wav');
	        		document.getElementById("imbs").setAttribute('src', xmlhttp.responseText);
	        		document.getElementById("imbs").setAttribute('type', 'audio/' + document.getElementById("imb_codec").value);
	        		document.getElementById("imbs_show").innerHTML = xmlhttp.responseText;;
	        		play_multi_sound("imbs");
	        	}
        	}
         }
        </script>
    </head>
    <body>
    <div data-role="page">
	    <div data-role="content" data-theme="b">
	        <h1>eSpeak Test Page <a href="http://espeak.sourceforge.net/index.html">notes</a></h1>
	        <div id="browser"></div>
	
	        <script type="text/javascript">
		        txt = "<p>Browser Name: " + navigator.appName + "</p>";
		        txt+= "<p>Browser Version: " + navigator.appVersion + "</p>";
		        txt+= "<p>Platform: " + navigator.platform + "</p>";
		        txt+= "<p>User-agent header: " + navigator.userAgent + "</p>";
		        document.getElementById("browser").innerHTML=txt;
	        </script>
	        <form action="">
	        <table border=0 bgcolor=#AAAAAA cellpadding=10 cellspacing=10>
	        <tr><td colspan=2>
	        	<div id=speak name=speak align=right>
	        		<audio id=imbs src="bob.wav" preload="auto"></audio>
	        	</div>
	        	<div data-role="collapsible" data-collapsed="true">
	        		<H3>Ajax Response</H3>
			       	<div data-role="none" id=output style="background-color:#EEEEEE;width:800px;height:20px;overflow:auto;"></div>
			        <div data-role="none" id=imbs_show style="background-color:#CCCCCC;width:800px;height:200px;overflow:auto;"></div>
		        </div>
	        </td></tr>
	        <tr><td align=right>Text</td><td>
	        	<input id=imb_text name=imb_text type=text size=60 />
	        </td></tr>
	        <tr><td align=right>Attributes</td><td>
	        	<input id=imb_attr name=imb_attr type=text size=60 />
	        </td></tr>
	        <tr><td align=right>
	    		<?php
	        		$ua = $_SERVER['HTTP_USER_AGENT'];
	        		if (preg_match('/Firefox/i',$ua) OR preg_match('/Chrome/i',$ua)) {
	        			$codec = "ogg";
	        		} else if (preg_match('/MSIE/i',$ua)) {
	        			$codec = "mpeg";
	        		} else if (preg_match('/Safari/i',$ua)) {
	        			$codec = "wav";
	        		} else {
	        			$codec = "wav";
	        		}
$codec = "wav";
	        		echo "<input id=imb_codec name=imb_codc type=hidden value=".$codec." />";
	        	?>
	        </td></tr>
	        <tr><td align=right>Default Voices</td><td>
	        	<select id=imb_sel name=imb_sel onchange=getElementById('imb_attr').value=this.value />
	        		<option value=''>Default</option>
	        		<option value='-ven-us+f3 -s160 -z -a165 -p45 -l15 -gz'>English</option>
	        		<option value='-vnl+f2 -s160 -z -a165 -p45 -l15 -gz'>Dutch</option>
	        		<option value='-ven+whisper'>Whisper</option>
	        	</select>
	        </td></tr>
	        <tr><td colspan=2 align=right>
	        	<input type=button value=Submit onClick=play_sound(); />
	        	<input type=button value=Replay onClick=play_multi_sound("imbs"); />
	        </td></tr>
	        </table>
	        </form>
	    </div>
    </div>
    </body>
</html>
