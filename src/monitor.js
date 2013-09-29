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

		//#if DEV
		/*setTimeout(function(){
			console.group("initial")
			for (var i = 0; i < this.stickies.length; i++){
				console.log(this.stickies[i].restrictBox, this.stickies[i].options.offset);
			}
			console.groupEnd();
		}.bind(this),500)*/
		//#endif
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