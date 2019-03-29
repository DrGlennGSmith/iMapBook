<?php
class TextToAudio {
	private $codec;
	private $attributes;
	
    function __construct($codec, $attributes) {
    	if ($codec != '') {
    		$this->codec = $codec;
    	} else {
    		$this->codec = 'wav';
    	}
    	if (strlen($attributes) > 2) {
    		$this->attributes = $attributes;
    	} else {
    		$this->attributes = '';
    	}
    }
    
    public function speak($text) {
        $descriptorspec = array(
           0 => array("pipe", "r"), // stdin is a pipe that the child will read from
           1 => array("pipe", "w"), // stdout is a pipe that the child will write to
           2 => array("pipe", "w")  // stderr is a pipe that the child will write to (use "a" to append)
        );
        $cwd = '/tmp';
        $out = 'error';
    
        if ($this->codec == 'ogg') { // OGG VORBIS
        	$cmd = "espeak ".$this->attributes." --stdin --stdout | oggenc -";
        } else if ($this->codec == 'mpeg'){ // MP3
        	$cmd = "espeak ".$this->attributes." --stdin --stdout | lame -V2 -";
        } else { // WAV = default
        	$cmd = "espeak ".$this->attributes." --stdin --stdout";
        }

        $process = proc_open($cmd, $descriptorspec, $pipes, $cwd);

    	if (is_resource($process)) {
            fwrite($pipes[0], $text) ;
            fclose($pipes[0]) ;
            $out = stream_get_contents($pipes[1]) ;
            proc_close($process);
        }
        return $out;
    }
}
