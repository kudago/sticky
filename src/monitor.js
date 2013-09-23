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
		this._update = this._update.bind(this);
		this.update = this.update.bind(this);

		this.bindObservers();
	},

	bindObservers: function(){
		var self = this;
		window.addEventListener("resize", function(e){
			console.log("resize")
			self.vp.height = window.innerHeight
		})

		window.addEventListener("scroll", this._update)
	},

	//throttles real recalc
	update: function(){
		console.log("recalc")
		clearTimeout(this._updateInterval);
		this._updateInterval = setTimeout(this._update, this.options.throttle);
	},

	_updateInterval: 0,
	_update: function(){
		this.vp.top = window.pageYOffset || document.documentElement.scrollTop;

		for (var i = 0; i < this.stickies.length; i++){
			this.stickies[i].check();
		}
	},

	//appends new sticker to the observable set
	add: function(sticker){
		this.stickies.push(sticker)
		this.update();
		return sticker
	}
}

//singletonze
var StickyMonitor = new Monitor();