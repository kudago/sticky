//Sticky - element being sticked at runtime
function Sticky(){
	this.create.apply(this, arguments);
}

//list of instances
Sticky.list = [];
Sticky.stack = {};

Sticky.prototype = {
	/** @expose */
	options: {
		"offset": 0,
		"restrictWithin": null, //element or bounding box
		"vAlign": 'top',
		"stickyClass": "is-stuck",
		"stubClass": "sticky-stub",
		"stack": null,
		"collapse": true
	},

	create: function(el, options){
		if (el.dataset["stickyId"]) {
			return console.log("Sticky already exist");
		}

		this.el = el;
		this.parent = this.el.parentNode;

		//recognize attributes
		this.options = extend({}, this.options, el.dataset, options);

		//query selector
		if ( typeof this.options["restrictWithin"] === "string" ){
			this.restrictWithin = document.body.querySelector(this.options["restrictWithin"]);			
		} else {
			this.restrictWithin = this.options["restrictWithin"];
		}

		//cast offset type
		this.options["offset"] = parseFloat(this.options["offset"]) || 0;
		
		//keep list
		this.el.dataset["stickyId"] = Sticky.list.length;
		this.id = Sticky.list.length;
		Sticky.list.push(this);

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
		this.parentBox = {
			top: 0,
			height: 0
		}

		//Detect whether stacking needed
		var prevEl = this.el;
		if (this.options["stack"]) {
			this.stack = this.options["stack"];
			if (!Sticky.stack[this.stack]){
				Sticky.stack[this.stack] = [this]
				this.stackId = 0
			} else {
				this.stackId = Sticky.stack[this.stack].length;
				Sticky.stack[this.stack].push(this)
			}
		}

		//stub is a spacer filling space when element is stuck
		this.stub = clone(this.el);
		this.stub.classList.add(this.options["stubClass"]);
		this.stub.style.visibility = "hidden";
		this.stub.style.display = "none"; 
		this.parent.insertBefore(this.stub, this.el);

		//save initial inline style
		this.initialStyle = this.el.style.cssText;
		this.initialDisplay = getComputedStyle(this.el)["display"];

		//ensure parent's container relative coordinates
		var pStyle = getComputedStyle(this.parent);
		if (pStyle.position == "static") this.parent.style.position = "relative";

		//bind methods
		this.check = this.check.bind(this);
		this.recalc = this.recalc.bind(this);
		this.adjustSizeAndPosition = this.adjustSizeAndPosition.bind(this);

		this.recalc();

		//bind events
		document.addEventListener("scroll", this.check);
		window.addEventListener("resize", this.recalc);

		//API events
		document.addEventListener("sticky:recalc", this.recalc);
	},

	//changing state necessity checker
	check: function(){
		var vpTop = window.pageYOffset || document.documentElement.scrollTop;
		//console.log("check:" + this.el.dataset["stickyId"], "isFixed:" + this.isFixed, this.restrictBox)
		if (this.isFixed){
			if (!this.isTop && vpTop + this.options["offset"] + this.height + this.mt + this.mb >= this.restrictBox.bottom){
				//check bottom parking needed
				this.parkBottom();
			}
			if (!this.isBottom && vpTop + this.options["offset"] + this.mt <= this.restrictBox.top){
				//check top parking needed
				this.parkTop();
			}
		} else {
			if ((this.isTop || this.isBottom) && vpTop + this.options["offset"] + this.mt > this.restrictBox.top){
				//fringe violation from top
				if (vpTop + this.options["offset"] + this.height + this.mt + this.mb < this.restrictBox.bottom){
					//fringe violation from top to the sticking zone
					this.stick();
				} else if (!this.isBottom) {
					//fringe violation from top lower than bottom
					this.stick();
					this.parkBottom();
				}
			}
		}
	},

	//sticking inner routines
	//when park top needed
	parkTop: function(){
		//this.el = this.parent.removeChild(this.el);
		this.el.style.cssText = this.initialStyle;
		this.el.classList.remove(this.options["stickyClass"]);
		//this.stub = this.parent.replaceChild(this.el, this.stub);
		this.stub.style.display = "none";

		this.isFixed = false;
		this.isTop = true;
		this.isBottom = false;
		//#if DEV
		console.log("parkTop")
		//#endif
	},
	//to make fixed
	//enhanced replace: faked visual stub is fastly replaced with natural one
	stick: function(){
		//this.el = this.parent.replaceChild(this.stub, this.el);
		this.stub.style.display = this.initialDisplay;
		this.makeStickedStyle(this.el);
		//this.parent.insertBefore(this.el, this.stub);

		this.isFixed = true;
		this.isTop = false;
		this.isBottom = false;

		//#if DEV
		console.log("stick")
		//#endif
	},

	//when bottom land needed
	parkBottom: function(){
		this.el.classList.remove(this.options["stickyClass"]);
		this.makeParkedBottomStyle(this.el);

		this.isFixed = false;
		this.isBottom = true;
		this.isTop = false;
		//#if DEV
		console.log("parkBottom")
		//#endif
	},

	//set up style of element as it is parked at the bottom
	makeParkedBottomStyle: function(el){
		el.style.cssText = this.initialStyle;
		el.style.position = "absolute";
		el.style.top = this.restrictBox.bottom - this.parentBox.top - this.height - this.mt - this.mb + "px";
		mimicStyle(el, this.stub);
		el.style.left = this.stub.offsetLeft + "px";
	},

	makeStickedStyle: function(el, srcEl){
		el.style.cssText = this.initialStyle;
		el.style.position = "fixed";
		el.style.top = this.options["offset"] + "px";
		el.classList.add(this.options["stickyClass"]);
		mimicStyle(el, srcEl || this.stub);
	},

	//count offset borders, container sizes. Detect needed container size
	recalc: function(){
		//console.group("recalc:" + this.el.dataset["stickyId"])
		console.log("recalc")
		var measureEl = (this.isTop ? this.el : this.stub);

		//update parent container size & offsets
		this.parentBox = getBoundingOffsetRect(this.parent);

		//update self size & position
		this.height = measureEl.offsetHeight;
		var mStyle = getComputedStyle(measureEl);
		this.ml = ~~mStyle.marginLeft.slice(0,-2);
		this.mr = ~~mStyle.marginRight.slice(0,-2);
		this.mt = ~~mStyle.marginTop.slice(0,-2);
		this.mb = ~~mStyle.marginBottom.slice(0,-2);

		//update restrictions
		if (this.restrictWithin instanceof Element){
			var offsetRect = getBoundingOffsetRect(this.restrictWithin)
			this.restrictBox.top = Math.max(offsetRect.top, getBoundingOffsetRect(measureEl).top);
			//console.log(getBoundingOffsetRect(this.stub))
			this.restrictBox.bottom = this.restrictWithin.offsetHeight + offsetRect.top;
		} else if (this.restrictWithin instanceof Object) {
			this.restrictBox = this.restrictWithin;
		} else {
			//case of parent container
			this.restrictBox.top = getBoundingOffsetRect(measureEl).top;
			this.restrictBox.bottom = this.parentBox.height + this.parentBox.top;
		}

		//make restriction up to next sibling within one container
		if (this.stack && Sticky.stack[this.stack][this.stackId - 1]){
			//make offsets for stacked mode
			var prevSticky = Sticky.stack[this.stack][this.stackId - 1];
			var prevMeasurer = (prevSticky.isTop ? prevSticky.el : prevSticky.stub);
			if (this.options["collapse"] && !isOverlap(measureEl, prevMeasurer)){
				this.options["offset"] = prevSticky.options["offset"];
			} else {
				this.options["offset"] = prevSticky.options["offset"] + prevSticky.height + Math.max(prevSticky.mt, prevSticky.mb)//collapsed margin
				for( var i = this.stackId; i--;){
					Sticky.stack[this.stack][i].restrictBox.bottom -= (this.height + Math.max(this.mt, this.mb));
				}
			}
		} else if (Sticky.list[this.id - 1]){
			Sticky.list[this.id - 1].restrictBox.bottom = this.restrictBox.top;
		}
		
		clearTimeout(this._updTimeout);
		this._updTimeout = setTimeout(this.adjustSizeAndPosition, 0);

		//console.log(this.restrictBox);
		//console.groupEnd();
	},

	adjustSizeAndPosition: function(){
		if (this.isTop){
			this.el.style.cssText = this.initialStyle;
		} else if (this.isBottom){
			this.makeParkedBottomStyle(this.el);
		} else {
			this.makeStickedStyle(this.el);
		}

		this.check();
	}

}