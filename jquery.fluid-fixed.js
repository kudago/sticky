(function ($){

	$.fn.fluidFixed = function (opts){
		var o = $.extend({
			style: {
				position:"fixed",
				"z-index":"100"
			},
			copyPosition: true, //Whether clone should clone position and size of the target or not 
			cloneTarget: true //Whether clone should clone the target or not
		}, opts)

		//Clone posiotion of parent
		function capturePosition($inheritor, $inheritee){
			$inheritor.css({
				left: $inheritee.offset().left, // - Math.floor(parseFloat($inheritee.css("margin-left"))), //Chrome round specity
				width: $inheritee.outerWidth() // + Math.floor(parseFloat($inheritee.css("margin-left")))
			})
		}

		return $(this).each(function (i, el) {
			var $el = $(el),
				ffTop = $el.offset().top,// + $el.height(),
				$clone = $('<div class="fluid-fixed-container"/>').insertAfter($el).append($el.clone().css({"margin":0, "left":0, "right":0}).removeClass("fluid-fixed")).css(o.style).css({"opacity": 0})
			
			capturePosition($clone, $el);

			$el.data("fluidFixed", {
				top: ffTop,
				el: $clone,
				refreshSizeAndPosition: function(){capturePosition($clone, $el)} //TODO: dynamically update position
			})
			$(document).scroll(function (){
				if ($(document).scrollTop() > ffTop){
					if (!$el.hasClass("fluid-fixed-visible")) {
						$el.addClass("fluid-fixed-visible");
						$el.data("fluidFixed").el.addClass("fluid-fixed-visible").css({"opacity": 1});
					}
				} else {
					if ($el.hasClass("fluid-fixed-visible")) {
						$el.removeClass("fluid-fixed-visible");
						$el.data("fluidFixed").el.removeClass("fluid-fixed-visible").css({"opacity": 0});
					}
				}
			})
		});
	}

	$(window).resize()

	$(function(){
		$('.fluid-fixed').fluidFixed();
	})

})(jQuery)