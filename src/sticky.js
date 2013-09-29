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
		this.initFlags();
		this.check();
	},

	initFlags: function(){
		var offset = getBoundingOffsetRect(this.el);
		if (offset.top < this.restrictBox.top) {
			this.parkTop();
		} else if (offset.top + offset.height > this.restrictBox.bottom){
			this.parkBottom();
		} else {
			this.stick();
		}
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
		this.stub = this.el.parentNode.removeChild(this.stub);
		this.clearMimicStyle();
		this.el.classList.remove(this.options.stickyClass);

		this.isFixed = false;
		this.isTop = true;
		this.isBottom = false;
		//#if DEV
		//console.log("parkTop")
		//#endif
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

		this.makeStickedStyle(this.stub2, this.el);

		this.el = this.el.parentNode.replaceChild(this.stubs, this.el);
		this.makeStickedStyle(this.el);
		this.stub2 = this.stub.parentNode.replaceChild(this.el, this.stub2);

		this.isFixed = true;
		this.isTop = false;
		this.isBottom = false;

		//#if DEV
		//console.log("stick")
		//#endif
	},

	//when bottom land needed
	parkBottom: function(){
		this.el.classList.remove(this.options.stickyClass);
		this.makeParkedBottomStyle(this.el);

		this.isFixed = false;
		this.isBottom = true;
		this.isTop = false;
		//#if DEV
		//console.log("parkBottom")
		//#endif
	},

	//set up style of element as it is parked at the bottom
	makeParkedBottomStyle: function(el){
		el.style.cssText = "";
		el.style.position = "absolute";
		el.style.top = this.restrictBox.bottom - this.parent.top - this.height + "px";
		this.mimicStyle(el, this.stub);
		el.style.left = this.stub.offsetLeft + "px";
	},

	makeStickedStyle: function(el, srcEl){
		el.style.cssText = "";
		el.style.position = "fixed";
		el.style.top = this.options.offset + "px";
		el.classList.add(this.options.stickyClass);
		this.mimicStyle(el, srcEl || this.stub);
	},

	//Stuff stubs fragment
	prepareStubs: function(){
		for (var i = 0; i < arguments.length; i++){
			this.stubs.appendChild(arguments[i])
		}
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

	_directions: ["left", "top", "right", "bottom"],
	_mimicProperties: ["padding-", "border-"],
	mimicStyle: function(to, from){
		var stubStyle = getComputedStyle(from),
			stubOffset = getBoundingOffsetRect(from);
		to.style.width = stubOffset.width + "px";
		to.style.left = stubOffset.left + "px";
		for (var i = 0; i < this._mimicProperties.length; i++){
			for (var j = 0; j < this._directions.length; j++){
				var prop = this._mimicProperties[i] + this._directions[j];
				to.style[prop] = stubStyle[prop];
			}
		}
	},

	clearMimicStyle: function(){
		this.el.style.cssText = this.initialStyle;
	}

}