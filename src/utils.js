/*----------------Utils*/
function extend(a){
	for (var i = 1, l = arguments.length; i<l; i++){
		var b = arguments[i];
		for (var k in b){
			a[k] = b[k];
		}
	}
	return a;
}

//attr parser
function parseDataAttributes(el) {
	var data = {}, v;
	for (var prop in el.dataset){
		var v = recognizeValue(el.dataset[prop]);
			if (v === "") v[i] = true;		
		data[prop] = v;
	}
	return data;
}

//returns value from string with correct type 
function recognizeValue(str){
	var v;
	if (str === "true") {
		return true;
	} else if (str === "false") {
		return false;
	} else if (!isNaN(v = parseFloat(str))) {
		return v;
	} else {
		return str;
	}
}

function getBoundingOffsetRect(el){
	var c = {top:0, left:0, right:0, bottom:0, width: 0, height: 0},
		rect = el.getBoundingClientRect();
	c.top = rect.top + (window.pageYOffset || document.documentElement.scrollTop);
	c.left = rect.left + (window.pageXOffset || document.documentElement.scrollLeft);
	c.width = el.offsetWidth;
	c.height = el.offsetHeight;
	c.right = document.width - rect.right;
	c.bottom = (window.innerHeight + (window.pageYOffset || document.documentElement.scrollTop) - rect.bottom)

	return c;
}

//#if DEV
	var pluginName = "sticky"
//#else
	/* #put "var pluginName = '" + pluginName + "'" */
//#endif



//#if DEV
var logDiv = document.createElement("div")
logDiv.style.position = "fixed";
logDiv.style.bottom = 0;
logDiv.style.left = 0;
document.body.appendChild(logDiv)
function log(val){
	logDiv.innerHTML = val;
}
//#endif