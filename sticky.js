//used as grunt build script
(function($){
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

function getBoundingOffsetRect(el){
	var c = {top:0, left:0, right:0, bottom:0, width: 0, height: 0},
		rect = el.getBoundingClientRect();
	c.top = rect.top + (window.pageYOffset || document.documentElement.scrollTop);
	c.left = rect.left + (window.pageXOffset || document.documentElement.scrollLeft);
	c.width = el.offsetWidth;
	c.height = el.offsetHeight;
	c.right = window.innerWidth - rect.right;
	c.bottom = rect.bottom + Math.max( document.body.scrollHeight, document.body.offsetHeight) - (window.innerHeight + (window.pageYOffset || document.documentElement.scrollTop))

	return c;
}

var cssPrefix = detectCSSPrefix(),
pluginName = 'sticky',
	className = 'sticky'



className = 'sticky'
	//observes scroll, resizing, changes of container size, ticks scroll, recalcs
//singleton
function Monitor(){
	this.create.apply(this);
}

Monitor.prototype = {
	options: {
		throttle: 10
	},
	create: function(){
		//create essential variables
		this.vp = {
			top: (window.pageYOffset || document.documentElement.scrollTop),
			height: window.innerHeight
		};

		//set of sticky elements
		this.stickies = [];

		//bind methods
		//this.scroll = this.scroll.bind(this);
		this.check = this.check.bind(this);
		this.recalc = this.recalc.bind(this);
		this.resize = this.resize.bind(this);

		this.bindObservers();

		className = 'sticky'
	},

	bindObservers: function(){
		var self = this;
		//general events
		window.addEventListener("resize", this.resize);
		document.addEventListener("scroll", this.check);
		//document.addEventListener("");

		//API events
		document.addEventListener("sticky:recalc", this.recalc);
	},

	//throttles check of
	/*scroll: function(){
		clearTimeout(this._checkInterval);
		this._checkInterval = setTimeout(this.check, 0);
	},

	_checkInterval: 0,*/
	check: function(e){
		this.vp.top = window.pageYOffset || document.documentElement.scrollTop;
	},

	//update size
	resize: function(){
		clearTimeout(this._recalcInterval);
		this._recalcInterval = setTimeout(this.recalc, this.options.throttle);
	},

	_recalcInterval: 0,
	recalc: function(){
		this.vp.height = window.innerHeight;
	},

	//appends new sticker to the observable set: called by stickers primarily
	add: function(sticky){
		this.stickies.push(sticky)
		sticky.el.stickyId = this.stickies.length - 1;
		this.resize();
		return sticky
	}
}

//singletonze
var StickyMonitor = new Monitor();
	//Sticky - element being sticked at runtime
function Sticky(){
	this.create.apply(this, arguments);
}

//modes of placing mutual items
Sticky.MODE = {
	NONE: 0,
	STACKED: 1,
	MUTUALLY_EXCLUSIVE: 2
}

Sticky.prototype = {
	options: {
		offset: 0,
		restrictWithin: null, //element or bounding box
		vAlign: 'top',
		stickyClass: "is-stuck",
		stubClass: "sticky-stub",
		mode: Sticky.MODE.MUTUALLY_EXCLUSIVE
	},

	create: function(el, options){
		this.el = el;

		//recognize attributes
		var parsedData = parseDataAttributes(this.el);

		if ( typeof parsedData.restrictWithin === "string" ){
			parsedData.restrictWithin = document.body.querySelector(parsedData.restrictWithin);			
		}

		this.options = extend({}, this.options, parsedData, options);

		//translate mode to number
		if (typeof this.options.mode === "string"){
			if (this.options.mode == "stacked"){
				this.options.mode = Sticky.MODE.STACKED
			} else if (this.options.mode == "exclusive"){
				this.options.mode = Sticky.MODE.MUTUALLY_EXCLUSIVE
			} else {
				this.options.mode = Sticky.MODE.NONE
			}
		}
		
		//hook monitor
		this.monitor = StickyMonitor;
		this.monitor.add(this);

		//init vars
		this.isFixed = false;
		this.isBottom = false;
		this.isTop = true;
		this.restrictBox = {
			top: 0,
			bottom: 9999
		};
		//self position & size
		this.height = 0;
		//parent position & size
		this.parent = {
			top: 0,
			height: 0
		}

		//Find stickies siblings within the container
		var prevEl = this.el;
		while ((prevEl = prevEl.previousSibling) !== null){
			if (prevEl.stickyId !== undefined){
				this.prevSticky = this.monitor.stickies[prevEl.stickyId];
				this.prevSticky.nextSticky = this;
				//console.log("found " + prevEl.stickyId)
				break;
			}
		}

		//stub is a spacer filling space when element is stuck
		this.stub = this.el.cloneNode(true);
		this.stub.classList.add(this.options.stubClass);
		this.stub.style.visibility = "hidden";

		//save initial inline style
		this.initialStyle = this.el.style.cssText;

		//visual stub needed for smooth rendering of switch
		this.stub2 = this.el.cloneNode(true);		

		//fast replacer
		this.stubs = document.createDocumentFragment();

		//ensure parent's container relative coordinates
		var pStyle = window.getComputedStyle(this.el.parentNode);
		if (pStyle.position == "static") this.el.parentNode.style.position = "relative";

		//bind to scroll (fasten than monitor cycle)
		this.check = this.check.bind(this);
		this.recalc = this.recalc.bind(this);
		document.addEventListener("scroll", this.check);
		window.addEventListener("resize", function(){ this.recalc(); this.check(); }.bind(this));

		this.recalc();
		this.check();
	},

	//changing state necessity checker
	check: function(){
		var vpTop = this.monitor.vp.top
		if (this.isFixed){
			if (!this.isTop && vpTop + this.options.offset + this.height >= this.restrictBox.bottom){
				//check bottom parking needed
				this.parkBottom();
			}
			if (!this.isBottom && vpTop + this.options.offset <= this.restrictBox.top){
				//check top parking needed
				this.parkTop();
			}
		} else {
			if ((this.isTop || this.isBottom)
				&& vpTop + this.options.offset > this.restrictBox.top
				&& vpTop + this.options.offset + this.height < this.restrictBox.bottom){
				//check fringe violation from top or bottom
				this.stick();
			}
		}
	},

	//sticking inner routines
	//when park top needed
	parkTop: function(){
		this.isFixed = false;
		this.isTop = true;
		this.isBottom = false;
		this.stub = this.el.parentNode.removeChild(this.stub);
		this.clearMimicStyle();
		this.el.classList.remove(this.options.stickyClass);
		className = 'sticky'
	},
	//to make fixed
	//enhanced replace: faked visual stub is fastly replaced with natural one
	stick: function(){
		if (!this.isBottom) {
			//if violating from the top
			this.prepareStubs(this.stub, this.stub2);
		} else {
			//if violating from the bottom
			this.prepareStubs(this.stub2);
		}
		this.makeStickedStyle(this.stub2);

		this.el = this.el.parentNode.replaceChild(this.stubs, this.el);
		this.makeStickedStyle(this.el);
		this.stub2 = this.stub.parentNode.replaceChild(this.el, this.stub2);

		this.isFixed = true;
		this.isTop = false;
		this.isBottom = false;

		className = 'sticky'
	},

	//Stuffs stubs fragment
	prepareStubs: function(){
		for (var i = 0; i < arguments.length; i++){
			this.stubs.appendChild(arguments[i])
		}
	},

	//when bottom land needed
	parkBottom: function(){
		this.isFixed = false;
		this.isBottom = true;
		this.isTop = false;
		this.el.classList.remove(this.options.stickyClass);
		this.makeParkedBottomStyle(this.el);
		className = 'sticky'
	},

	//set up style of element as it is parked at the bottom
	makeParkedBottomStyle: function(el){
		el.style.cssText = "";
		el.style.position = "absolute";
		el.style.top = this.restrictBox.bottom - this.parent.top - this.height + "px";
		el.style.width = this.stub.offsetWidth + "px";
	},

	makeStickedStyle: function(el){
		el.style.cssText = "";
		el.style.position = "fixed";
		el.style.top = this.options.offset + "px";
		el.classList.add(this.options.stickyClass);
		this.mimicStyle(el, this.stub);
	},

	//count offset borders, container sizes. Detect needed container size
	recalc: function(){
		//console.group("recalc:" + this.el.stickyId)

		var measureEl = (this.isFixed ? this.stub : this.el);

		//update parent container size & offsets
		this.parent = getBoundingOffsetRect(measureEl.parentNode)

		//update self size & position
		this.height = measureEl.offsetHeight;

		//update restrictions
		if (this.options.restrictWithin instanceof Element){
			var offsetRect = getBoundingOffsetRect(this.options.restrictWithin)
			this.restrictBox.top = Math.max(offsetRect.top, getBoundingOffsetRect(measureEl).top);
			//console.log(getBoundingOffsetRect(this.stub))
			this.restrictBox.bottom = this.options.restrictWithin.offsetHeight + offsetRect.top;
		} else if (this.options.restrictWithin instanceof Object) {
			this.restrictBox = this.options.restrictWithin;
		} else {
			//case of parent container
			this.restrictBox.top = getBoundingOffsetRect(measureEl).top;
			this.restrictBox.bottom = this.parent.height + this.parent.top;
		}

		//make restriction up to next sibling within one container
		if (this.prevSticky && this.options.mode === Sticky.MODE.MUTUALLY_EXCLUSIVE){
			this.prevSticky.restrictBox.bottom = this.restrictBox.top;
		}

		//make offsets for stacked mode
		if (this.options.mode === Sticky.MODE.STACKED){
			if (this.prevSticky){
				var prevMeasurer = this.prevSticky.isFixed ? this.prevSticky.stub : this.prevSticky.el;
				this.options.offset = this.prevSticky.options.offset + prevMeasurer.offsetHeight;
				var prevEl = this;
				while((prevEl = prevEl.prevSticky)){
					prevEl.restrictBox.bottom -= this.height;
				}
			}
		}

		//adjust style
		if (this.isFixed){
			this.mimicStyle(this.el, this.stub);
		} else {
			this.clearMimicStyle();
		}	

		//console.log(this.restrictBox);
		//console.log(this.prevSticky && this.prevSticky.restrictBox)
		//console.groupEnd();
	},

	mimicStyle: function(to, from){
		var stubStyle = getComputedStyle(from),
			stubOffset = getBoundingOffsetRect(from);
		to.style.width = stubStyle.width;
		if (stubStyle.left !== "auto"){
			to.style.left = stubOffset.left + "px";
		}
		if (stubStyle.right !== "auto"){
			to.style.right = stubOffset.right + "px";
		}
	},

	clearMimicStyle: function(){
		this.el.style.cssText = this.initialStyle;
	}

}
	//jquery-plugin
if ($){
	$.fn[pluginName] = function (arg) {
		return this.each(function(i,e){
			var $e = $(e);
			var instance = new Sticky($e[0], arg);
			$e.data(pluginName, instance);
		})
	};

	$.Sticky = Sticky;
}
})(window.jQuery || window.Zepto);