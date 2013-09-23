//Sticky - element being sticked at runtime
function Sticky(){
	this.create.apply(this, arguments);
}

Sticky.prototype = {
	options: {
		offset: 0,
		restrictWithin: null, //element or bounding box
		vAlign: 'top',
		stickyClass: "is-stuck"
	},

	create: function(el, options){
		this.el = el;

		this.options = extend({}, this.options, options);

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

		//ensure parent's container relative coordinates
		var pos = getComputedStyle(this.parentNode);
		if (pos == "static") this.parentNode.style = "relative"; 

		//hook monitor
		this.monitor = StickyMonitor;
		this.monitor.add(this);

		//create spacer-stub
		this.spacer = this.el.cloneNode();//document.createElement("div");

		this.recalc();
	},

	//changing state necessity checker
	check: function(){
		var vpTop = this.monitor.vp.top
		if (this.isFixed){
			if (!this.isBottom && vpTop + this.options.offset < this.restrictBox.top){
				//check top stick needed
				this.isFixed = false;
				this.isTop = true;
				this.el.style.position = "";
				this.el.classList.remove(this.options.stickyClass);
				console.log("sticktop")
			} else if (vpTop + this.options.offset + this.height > this.restrictBox.bottom){
				//check bottom stick needed
				this.isBottom = true;
				this.isFixed = false;
				console.log("stickvottom");
				this.el.style.position = "absolute";
				this.el.style.top = this.restrictBox.bottom - this.parent.top - this.height + "px";
				this.el.classList.remove(this.options.stickyClass);
			}
		} else {
			if (vpTop + this.options.offset > this.restrictBox.top && !this.isBottom){
				//check fringe violation from top
				this.isFixed = true;
				this.isTop = false;
				console.log("freefromtop")
				this.el.style.position = "fixed";
				this.el.style.top = this.options.offset + "px";
				this.el.classList.add(this.options.stickyClass);
			} else if (this.isBottom && vpTop + this.options.offset + this.height < this.restrictBox.bottom) {
				//check fringe violation from bottom
				this.isFixed = true;
				this.isBottom = false;
				this.el.style.position = "fixed";
				console.log("freefrombottom")
				this.el.style.top = this.options.offset + "px";
				this.el.classList.add(this.options.stickyClass);
			}
		}
	},

	//count offset borders, container sizes. Detect needed container size
	recalc: function(){
		//save basic element style

		//update restrictions
		if (this.options.restrictWithin instanceof Element){
			this.restrictBox.top = offsetTop(this.options.restrictWithin);
			this.restrictBox.bottom = this.options.restrictWithin.clientHeight + this.restrictBox.top;
		} else if (this.options.restrictWithin instanceof Object) {
			this.restrictBox = this.options.restrictWithin
		} else {
			this.restrictBox.top = offsetTop(this.el.parentNode)
			this.restrictBox.bottom = this.el.parentNode.clientHeight + this.restrictBox.top;
		}

		//update self size & position
		this.height = this.el.clientHeight;
		console.log(this.restrictBox)

		//update parent container size & offsets
		this.parent.top = offsetTop(this.el.parentNode);
		this.parent.height = this.el.parentNode.clientHeight;
	}






}



$.fn.fluidFixed = function (opts){
	return $(this).each(function (i, el) {

		var $ff = $(el);

		if ($ff.data("fluid-fixed")) return;

		ffcId++;

		var o = $.extend({}, defaults);
			o = $.extend(o, $ff.data());
			o = $.extend(o, opts);

		var	ffTop = o.valign == 'top' ? $ff.offset().top : ($ff.offset().top - $wnd.height());					
				
		var	$ffRestrictor = $(o.container || $ff.parent())
			
		var ffStop = ($ffRestrictor.offset().top + $ffRestrictor.outerHeight() - $ff.outerHeight()) - (o.valign == 'top' ? 0 : $wnd.height());

		//Init position and container
		var $ffc = $('<div id="fluid-fixed-container-' + ffcId + '" class="fluid-fixed-container ' + o.containerClass + '" data-stub="fluid-fixed-stub-' + ffcId + '"/>').appendTo($body);
		adoptPosition($ffc, $ff);

		//Stub instead of original ff
		var $ffStub = $('<div id="fluid-fixed-stub-' + ffcId + '" class="fluid-fixed-stub ' + o.stubClass + '" data-container="' + $ffc.attr("id") + '"/>').css({
			width: $ff.outerWidth(),
			height: $ff.outerHeight(),
			"margin-left": $ff.css("margin-left"),
			left: $ff.css("left")
		})

		if (!o.noStub){
			$ffStub.insertAfter($ff);
		}

		$ffc.append($ff.css({"margin": 0, "left":0, "right":0, "top": 0, "bottom": 0}));

		$ff.data({
			"container": "fluid-fixed-container-" + ffcId,
			"stub": "fluid-fixed-stub-" + ffcId,
			"fluid-fixed": true
		})

		$doc.scroll(checkPosition)

		function checkPosition(){
			//Begin trip
			if ($doc.scrollTop() > ffTop){
				if (!$ffc.hasClass("fixed")) {
					//console.log("start")
					$ffc.addClass("fixed");
					if (o.valign == 'top'){
						$ffc.css({"top": o.offset, "bottom": "auto"})
					} else {
						$ffc.css({"top": "auto", "bottom": o.offset})							
					}
				}
			} else {
				if ($ffc.hasClass("fixed")) {
					$ffc.removeClass("fixed");
					if (o.valign == 'top'){
						$ffc.css("top", $ffStub.offset().top)
					} else {
						$ffc.css("top", $ffStub.offset().top + $ffStub.height() - $ffc.height())						
					}
				}
			}

			//Stop trip
			if ($doc.scrollTop() + o.offset > ffStop){
				if (!$ffc.hasClass("stopped")) {
					//console.log("stop")
					$ffc.addClass("stopped");
					if (o.valign == 'top'){
						$ffc.css("top", ffStop);
					} else {
						$ffc.css("top", ffStop + $wnd.height());
						$ffc.css("bottom", "auto");
					}
				}
			} else {
				if ($ffc.hasClass("stopped")) {
					$ffc.removeClass("stopped");
					if (o.valign == 'top'){
						$ffc.css("top", o.offset)
					} else {
						$ffc.css("bottom", o.offset)
						$ffc.css("top", "auto")						
					}
				}
			}
		}
		
		//Take position of target
		function adoptPosition($adopter, $target){
			if (o.valign != "top") {
				$ffc.css({
					top: "auto"
				})
			}
			$adopter.css({
				top: $target.offset().top,
				left: $target.offset().left, // - Math.floor(parseFloat($target.css("margin-left"))), //Chrome round specity
				width: $target.outerWidth(), // + Math.floor(parseFloat($target.css("margin-left")))
				height: $target.outerHeight()
			})
		}

		$wnd.resize(function(){
			ffTop = o.valign == 'top' ? $ffStub.offset().top : ($ffStub.offset().top - $wnd.height());
			ffStop = ($ffRestrictor.offset().top + $ffRestrictor.outerHeight() - $ffStub.outerHeight()) - (o.valign == 'top' ? 0 : $wnd.height());
			adoptPosition($ffc, $ffStub);
			if ($ffc.hasClass("fixed")){
				if (o.valign == 'top'){
					$ffc.css({"top": o.offset, "bottom": "auto"})
				} else {
					$ffc.css({"top": "auto", "bottom": o.offset})							
				}
			}
			checkPosition();
		})

	})
}