//observes scroll, resizing, changes of container size, ticks scroll, recalcs
//singleton
function Monitor(){
	this.create.apply(this, arguments)
}

Monitor.prototype = {
	options: {
		throttle: 0
	},
	create: function(){
		//create essential variables
		this.vp = {
			top: window.pageXOffset,
			height: window.innerHeight
		};

		//set of sticky elements
		this.stickies = [];

		//bind methods
		this._scroll = this._scroll.bind(this);
		this.scroll = this.scroll.bind(this);
		this.resize = this.resize.bind(this);

		this.bindObservers();
	},

	bindObservers: function(){
		var self = this;
		window.addEventListener("resize", this.resize)

		window.addEventListener("scroll", this._scroll)
	},

	//throttles check of
	scroll: function(){
		clearTimeout(this._scrollInterval);
		this._scrollInterval = setTimeout(this._scroll, this.options.throttle);
	},

	_scrollInterval: 0,
	_scroll: function(){
		this.vp.top = window.pageYOffset || document.documentElement.scrollTop;

		for (var i = 0; i < this.stickies.length; i++){
			this.stickies[i].check();
		}
	},

	//update size
	resize: function(){
		this.vp.height = window.innerHeight;
		for (var i = 0; i < this.stickies.length; i++){
			this.stickies[i].recalc();
		}
	},

	//appends new sticker to the observable set: called by stickers primarily
	add: function(sticky){
		this.stickies.push(sticky)
		sticky.el.stickyId = this.stickies.length - 1;
		this.scroll();
		return sticky
	}
}

//singletonze
var StickyMonitor = new Monitor();