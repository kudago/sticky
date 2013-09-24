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

//stupid prefix detector
function detectCSSPrefix(){
	var puppet = document.documentElement;
	var style = document.defaultView.getComputedStyle(puppet, "");
	if (style.transform) return "";
	if (style["-webkit-transform"]) return "-webkit-";
	if (style["-moz-transform"]) return "-moz-";
	if (style["-o-transform"]) return "-o-";
	if (style["-khtml-transform"]) return "-khtml-";
	return "";
}

//simple math limiter
function limit(v, min, max){
	return Math.max(min, Math.min(max, v));
}

//attr parser
function parseDataAttributes(el, multiple) {
	var data = {}, v;
	for (var prop in el.dataset){
		var v;
		if (multiple) {
			v = el.dataset[prop].split(",");
			for (var i = v.length; i--;){
				v[i] = recognizeValue(v[i].trim());
				if (v[i] === "") v[i] = null;
			}
		} else {
			v = recognizeValue(el.dataset[prop]);
			if (v === "") v[i] = true;
		}
		
		data[prop] = v;
	}
	return data;
}

//returns value from string with correct type 
function recognizeValue(str){
	if (str === "true") {
		return true;
	} else if (str === "false") {
		return false;
	} else if (!Number.isNaN(v = parseFloat(str))) {
		return v;
	} else {
		return str;
	}
}

var cssPrefix = detectCSSPrefix(),
//#ifdef pluginName && pickerClass && className && altPickerClass
	/* #put "pluginName = '" + pluginName + "'," */
	/* #put "className = '" + className + "'" */
//#else
	pluginName = "sticky",
	className = "sticky"
//#endif


function offsetTop(el){
	var top = 0,
		rect = el.getBoundingClientRect();
	top = rect.top + (window.pageYOffset || document.documentElement.scrollTop);

	return top;
}