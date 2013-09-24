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
		offset: 50,
		restrictWithin: null, //element or bounding box
		vAlign: 'top',
		stickyClass: "is-stuck",
		stubClass: "sticky-stub",
		mode: Sticky.MODE.MUTUALLY_EXCLUSIVE
	},

	create: function(el, options){
		this.el = el;

		this.options = extend({}, this.options, options);

		//hook monitor
		this.monitor = StickyMonitor;
		this.monitor.add(this);

		//init vars
		this.isFixed = false;
		this.isBottom = false;
		this.isTop = false;
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
				this.prevSticky.recalc();
				break;
			}
		}


		//stub is a spacer filling space when element is stuck
		this.stub = this.el.cloneNode(true);
		this.stub.classList.add(this.options.stubClass);
		//this.stub.style.opacity = 0;
		this.stub.style.visibility = "hidden";

		//ensure parent's container relative coordinates
		var pStyle = window.getComputedStyle(this.el.parentNode);
		if (pStyle.position == "static") this.el.parentNode.style.position = "relative"; 

		//create spacer-stub
		this.spacer = this.el.cloneNode();//document.createElement("div");

		this.recalc();
	},

	//changing state necessity checker
	check: function(){
		var vpTop = this.monitor.vp.top

		if (this.isFixed){
			if (!this.isBottom && vpTop + this.options.offset < this.restrictBox.top){
				//check top unfix needed
				this.unstick();
				this.isTop = true;
			} else if (vpTop + this.options.offset + this.height > this.restrictBox.bottom){
				//check bottom unfix needed
				this.unstick(true);
				this.isBottom = true;
				this.el.style.position = "absolute";
				this.el.style.top = this.restrictBox.bottom - this.parent.top - this.height + "px";
			}
		} else {
			if (vpTop + this.options.offset > this.restrictBox.top && !this.isBottom){
				//check fringe violation from top
				this.isTop = false;
				this.stick();
			} else if (this.isBottom && vpTop + this.options.offset + this.height < this.restrictBox.bottom) {
				//check fringe violation from bottom
				this.isBottom = false;
				this.stick();
			}
		}
	},

	//sticking inner routines
	//when boundary reached
	unstick: function(preserveStub){
		this.isFixed = false;		
		if (!preserveStub) {
			this.stub = this.el.parentNode.removeChild(this.stub);
			this.clearMimicStyle();
		}
		this.el.style.position = "";
		this.el.classList.remove(this.options.stickyClass);

	},
	//to make fixed
	stick: function(){
		this.isFixed = true;
		this.el.style.position = "fixed";
		this.el.style.top = this.options.offset + "px";
		this.el.classList.add(this.options.stickyClass);
		this.el.parentNode.insertBefore(this.stub, this.el);
		this.mimicStubStyle();
	},

	//count offset borders, container sizes. Detect needed container size
	recalc: function(){
		//save basic element style
		console.log(this.el.stickyId)
		console.log(this.restrictBox)

		//update parent container size & offsets
		this.parent.top = offsetTop(this.el.parentNode);
		this.parent.height = this.el.parentNode.offsetHeight;

		//update restrictions
		if (this.options.restrictWithin instanceof Element){
			this.restrictBox.top = offsetTop(this.options.restrictWithin);
			this.restrictBox.bottom = this.options.restrictWithin.offsetHeight + this.restrictBox.top;
		} else if (this.options.restrictWithin instanceof Object) {
			this.restrictBox = this.options.restrictWithin
		} else {
			//case of parent container
			if (this.isFixed){
				this.restrictBox.top = offsetTop(this.stub);
				this.restrictBox.bottom = this.parent.height + this.parent.top;
			} else {
				this.restrictBox.top = offsetTop(this.el)
				this.restrictBox.bottom = this.parent.height + this.parent.top;
			}
			
			//make restriction up to next sibling within one container
			if (this.prevSticky && this.options.mode === Sticky.MODE.MUTUALLY_EXCLUSIVE){
				this.prevSticky.restrictBox.bottom = this.restrictBox.top;			
			}
		}

		if (this.isFixed){
			this.mimicStubStyle();
		} else {
			this.clearMimicStyle();
		}

		//update self size & position
		this.height = this.el.offsetHeight;
	},

	mimicStubStyle: function(){
		var stubStyle = getComputedStyle(this.stub)
		this.el.style.width	= stubStyle.width;
	},

	clearMimicStyle: function(){
		this.el.style.cssText = "";
	}

}